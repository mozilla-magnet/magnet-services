const shortId = require('../utils/shortid');
const HttpError = require('../express/httperror');

module.exports = function(knex) {
  const st = require('knex-postgis')(knex);

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
        return { id: dbResponse[0], shortId: shortId.numToShortId(dbResponse[0]) };
      });
  }

  function getBeaconInfo(slug, channelName) {
    const constraints = {
      id: shortId.shortIdToNum(slug),
    };

    if (channelName) {
      constraints['channel_name'] = channelName;
    }

    return knex('beacon')
      .select('channel_name', 'id', st.asGeoJSON('location'), 'canonical_url')
      .where(constraints)
      .limit(1)
      .then((response) => {
        if (response.length > 0) {
          return response[0];
        }

        throw new HttpError(404, `Could not find beacon: ${slug}`, 'ENOTFOUND');
      })
      .then((beaconInfo) => {
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
      .where('id', shortId.shortIdToNum(slug))
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

  return {
    create: createNewBeacon,
    read: getBeaconInfo,
    patch: updateBeacon,
  };
};
