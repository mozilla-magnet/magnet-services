const environment = process.env.ENV || 'dev';
const dbConfig = require('../../database.json')[environment];

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
      short_id: beaconData.short_id,
      canonical_url: beaconData.content_attachment.url,
      call_to_action: JSON.stringify(beaconData.content_attachment.calls_to_action),
      extra_metadata: JSON.stringify(beaconData.content_attachment.additional_metadata),
      location: st.geography(st.makePoint(beaconData.location.long, beaconData.location.lat)),
      is_virtual: beaconData.is_virtual
    });
}

function searchBeacons(lat, long, radius) {
  console.log('searching beacons');
  const point = st.makePoint(lat, long);

  return knex('beacon')
    .select('channel_name', 'short_id', st.asGeoJSON('location'))
    .where(st.dwithin('location', point, radius));
}

module.exports = {
  createNewBeacon: createNewBeacon,
  createNewChannel: createNewChannel,
  searchBeacons: searchBeacons,
};
