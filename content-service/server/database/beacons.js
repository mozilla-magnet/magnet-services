const { shortIdToNum, numToShortId, } = require('../utils/shortid');
const HttpError = require('../express/httperror');
const SHORT_URL = require('../../config.json').short_url;
const nodeUrl = require('url');
const resolveUrl = nodeUrl.resolve;
const nodePath = require('path');

const PARSED_SHORT_URL = Object.freeze(nodeUrl.parse(SHORT_URL));

module.exports = function(knex) {
  const st = require('knex-postgis')(knex);

  function selectBeacon() {
    return knex('beacon')
      .select(
        'id', 'channel_name', 'canonical_url',
        'call_to_action', 'extra_metadata',
        st.asGeoJSON('location'), 'is_virtual');
  }

  function createNewBeacon(channel, beaconData) {
    console.log('creating new beacon');
    if (!beaconData) {
      throw new HttpError(400, 'Beacon data not specified in the request body', 'EINVAL');
    }

    if (!beaconData.content_attachment) {
      throw new HttpError(400, 'Beacon data does not specify a \'content_attachment\'.', 'EINVAL');
    }

    return knex('beacon')
      .insert({
        channel_name: channel.trim(),
        canonical_url: beaconData.content_attachment.url,
        call_to_action: JSON.stringify(beaconData.content_attachment.calls_to_action || {}),
        extra_metadata: JSON.stringify(beaconData.content_attachment.additional_metadata || {}),
        location: st.geography(st.makePoint(beaconData.location.long, beaconData.location.lat)),
        is_virtual: beaconData.is_virtual
      }, 'id').then((dbResponse) => {
        return { id: dbResponse[0], shortId: numToShortId(dbResponse[0]) };
      });
  }

  function mapDatabaseResponseToApiResponse(beacon) {
    const location = JSON.parse(beacon.location);
    const short = numToShortId(beacon.id);
    return {
      id: short,
      short_url: resolveUrl(SHORT_URL, short),
      channel: beacon.channel_name,
      url: beacon.canonical_url,
      call_to_action: JSON.parse(beacon.call_to_action),
      extra_metadata: JSON.parse(beacon.extra_metadata),
      location:  {
        latitude: location.coordinates[1],
        longitude: location.coordinates[0],
      },
      is_virtual: beacon.is_virtual,
    };
  }

  function shortUrlToId(url) {
    const parsedUrl = nodeUrl.parse(url);
    const isShortUrl =
      parsedUrl.host === PARSED_SHORT_URL.host &&
      parsedUrl.protocol === PARSED_SHORT_URL.protocol;

    if (!isShortUrl) {
      return false;
    }

    return nodePath.basename(parsedUrl.pathname);
  }

  function searchUrls(urls) {
    if (!Array.isArray(urls)) {
      throw new HttpError(400, 'Request body must be an array', 'EINVAL');
    }

    if (urls.length > 100) {
      throw new HttpError(400, 'Request body too large (limit of 100 items)', 'E2BIG');
    }

    if (urls.length === 0) {
      return Promise.resolve({});
    }

    // Split the search into two, search for short IDs if the URLs is a short
    // URL, and search for 'general' URLs if the URL is not a Magnet short URL.
    const searchUrls = [];

    const searchIds = urls
      .map((url) => {
        const shortId = shortUrlToId(url);
        // Not a magnet short URL, so add to the general search for urls
        if (!shortId) {
          searchUrls.push(url);
        }

        return shortId;
      })
      .filter(shortId => !!shortId);

    const rawQuery = searchUrls.map(_ => '?').join(',');
    let queryBuilder = selectBeacon();

    if (searchIds.length) {
      queryBuilder = queryBuilder.whereIn('id', searchIds);
    }

    // Note that due to ambiguity within knex, arrays must be passed as arguments within a
    // containing array when creating prepared statements.
    return queryBuilder
     .orWhereRaw('canonical_url = ANY(?::text[])', [searchUrls])
     .then((response) => {
       return response.map(mapDatabaseResponseToApiResponse);
     });
  }

  function getAllForChannel(channelName) {
    if (!(channelName && channelName.length)) {
      throw new HttpError(400, 'Must specify channel name in request');
    }

    return selectBeacon()
      .where('channel_name', channelName)
      .then((response) => {
        return response.map(mapDatabaseResponseToApiResponse);
      });
  }

  function batchGetBeaconInfoForShortIds(shortIds) {
    const ids = shortIds
      .filter(shortId => !!shortId)
      .map(shortIdToNum);

    return selectBeacon()
      .whereIn('id', ids)
      .then((response) => {
        return response.map(mapDatabaseResponseToApiResponse);
      });
  }

  function getBeaconInfo(slug, channelName) {
    const constraints = {
      id: shortIdToNum(slug),
    };

    if (channelName) {
      constraints['channel_name'] = channelName;
    }

    return selectBeacon()
      .where(constraints)
      .limit(1)
      .then((response) => {
        if (response.length > 0) {
          return response[0];
        }

        throw new HttpError(404, `Could not find beacon: ${slug}`, 'ENOTFOUND');
      })
      .then(mapDatabaseResponseToApiResponse);
  }

  function updateBeacon(slug, patchData) {

    const updateObject = {};

    let hasPatchableProperties = false;

    if (patchData.url) {
      updateObject.canonical_url = patchData.url;
      hasPatchableProperties = true;
    }

    if (patchData.location) {
      if (!(patchData.location.latitude && patchData.location.longitude)) {
        throw new HttpError(400, 'A location update must include the latitude, and longitude values', 'EINVAL');
      }

      updateObject.location = st.geography(st.makePoint(patchData.location.longitude, patchData.location.latitude));
      hasPatchableProperties = true;
    }

    if (!hasPatchableProperties) {
      throw new HttpError(400, 'New beacon data does not include any properties available for update', 'EINVAL');
    }

    return selectBeacon()
      .where('id', shortIdToNum(slug))
      .update(updateObject)
      .returning(['channel_name', 'canonical_url', st.asGeoJSON('location')])
      .then((response) => {
        if (response.length < 1) {
          throw new HttpError(404, `Could not find beacon id: ${slug}`, 'ENOTFOUND');
        }

        const beaconInfo = response[0];

        const parsedGeoJson = JSON.parse(beaconInfo.location);
        return {
          id: slug,
          channel: beaconInfo.channel_name,
          url: beaconInfo.canonical_url,
          location: {
            latitude: parsedGeoJson.coordinates[1],
            longitude: parsedGeoJson.coordinates[0],
          }
        };
      });
  }

  function truncateTable() {
    return knex('beacon').delete();
  }

  return {
    create: createNewBeacon,
    read: getBeaconInfo,
    getAllForChannel,
    patch: updateBeacon,
    truncate: truncateTable,
    getByUrls: searchUrls,
  };
};
