const { shortIdToNum, numToShortId, } = require('../utils/shortid');
const HttpError = require('../express/httperror');

module.exports = function(knex) {
  const st = require('knex-postgis')(knex);
  const utils = require('./utils')(knex);

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
        channel_id: channel.trim(),
        canonical_url: beaconData.content_attachment.url,
        call_to_action: JSON.stringify(beaconData.content_attachment.calls_to_action || {}),
        extra_metadata: JSON.stringify(beaconData.content_attachment.additional_metadata || {}),
        location: st.geography(st.makePoint(beaconData.location.long, beaconData.location.lat)),
        is_virtual: beaconData.is_virtual
      }, 'id').then((dbResponse) => {
        return { id: dbResponse[0], shortId: numToShortId(dbResponse[0]) };
      });
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
        const shortId = utils.shortUrlToId(url);
        // Not a magnet short URL, so add to the general search for urls
        if (!shortId) {
          searchUrls.push(url);
        }

        return shortId;
      })
      .filter(shortId => !!shortId)
      .map(shortIdToNum);

    let queryBuilder = utils.selectBeacons();

    if (searchIds.length) {
      queryBuilder = queryBuilder.whereIn('beacon.id', searchIds);
    }

    // Note that due to ambiguity within knex, arrays must be passed as arguments within a
    // containing array when creating prepared statements.
    return queryBuilder
     .orWhereRaw('canonical_url = ANY(?::text[])', [searchUrls])
     .then((response) => {
       return response.map(utils.mapDatabaseResponseToApiResponse);
     });
  }

  function getAllForChannel(channelId) {
    if (!(channelId && channelId.length)) {
      throw new HttpError(400, 'Must specify channel name in request');
    }

    return utils.selectBeacons()
      .where('channel_id', channelId)
      .then((response) => {
        return response.map(utils.mapDatabaseResponseToApiResponse);
      });
  }

  function batchGetBeaconInfoForShortIds(shortIds) {
    const ids = shortIds
      .filter(shortId => !!shortId)
      .map(shortIdToNum);

    return utils.selectBeacons()
      .whereIn('id', ids)
      .then((response) => {
        return response.map(utils.mapDatabaseResponseToApiResponse);
      });
  }

  function getBeaconInfo(slug, channelId) {
    console.log("SHORT ID: ", slug);
    console.log("CHANNEL ID: ", channelId);
    const constraints = {
      'beacon.id': shortIdToNum(slug),
    };

    if (channelId) {
      constraints['channel_id'] = channelId;
    }

    return utils.selectBeacons()
      .where(constraints)
      .limit(1)
      .then((response) => {
        if (response.length > 0) {
          return response[0];
        }

        throw new HttpError(404, `Could not find beacon: ${slug}`, 'ENOTFOUND');
      })
      .then(utils.mapDatabaseResponseToApiResponse);
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

    return knex('beacon')
      .where('id', shortIdToNum(slug))
      .update(updateObject)
      .returning(['channel_id', 'canonical_url', st.asGeoJSON('location')])
      .then((response) => {
        if (response.length < 1) {
          throw new HttpError(404, `Could not find beacon id: ${slug}`, 'ENOTFOUND');
        }

        const beaconInfo = response[0];

        const parsedGeoJson = JSON.parse(beaconInfo.location);
        return {
          id: slug,
          channel: beaconInfo.channel_id,
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
