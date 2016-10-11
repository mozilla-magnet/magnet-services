const environment = process.env.ENV || 'dev';
const dbConfig = require('../../database.json')[environment];

const shortId = require('../utils/shortid');

const HttpError = require('../express/httperror');

const knex = (function createPool() {
  const knex = require('knex')({
    client: 'pg',
    connection: dbConfig,
    pool: { min: 3, max: 10 }
  });

  return knex;
}());

const st = require('knex-postgis')(knex);

function createNewChannel(channelInfo) {
  console.log(channelInfo);
  return knex('channel')
    .insert({
      name: channelInfo.name,
      email: channelInfo.email,
      tags: channelInfo.tags || '',
    })
    .then((dbResponse) => {
      return { created: channelInfo.name };
    }).catch((err) => {
      throw {
        message: err.detail
      };
    });
}

function createNewBeacon(channel, beaconData) {
  console.log('creating new beacon');
  return knex('beacon')
    .insert({
      channel_name: channel.trim(),
      canonical_url: beaconData.content_attachment.url,
      call_to_action: JSON.stringify(beaconData.content_attachment.calls_to_action),
      extra_metadata: JSON.stringify(beaconData.content_attachment.additional_metadata),
      location: st.geography(st.makePoint(beaconData.location.long, beaconData.location.lat)),
      is_virtual: beaconData.is_virtual
    }, 'id').then((dbResponse) => {
      return { id: dbResponse[0], shortId: shortId.numToShortId(dbResponse[0]) };
    });
}

function searchBeacons(lat, long, radius) {
  console.log('searching beacons');
  const point = st.makePoint(lat, long);

  return knex('beacon')
    .select('channel_name', 'id', st.asGeoJSON('location'))
    .where(st.dwithin('location', point, radius));
}

function getCanonicalUrlForShortId(id) {
  console.log(shortId);
  return knex('beacon')
    .select('channel_name', 'canonical_url')
    .where('id', shortId.shortIdToNum(id))
    .then((response) => {
      if (response.length > 0) {
        return response[0];
      }

      throw new HttpError(404, `Could not find short url: ${id}`, 'ENOTFOUND');
    });
}

module.exports = {
  createNewBeacon,
  createNewChannel,
  searchBeacons,
  getCanonicalUrlForShortId,
};
