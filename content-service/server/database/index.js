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
  return knex('beacon')
    .insert({
      channel_name: channel,
      // TODO generate unique shortId if not specified
      short_id: beaconData.shortId,
      canonical_url: beaconData.content_attachment.url,
      call_to_action: JSON.stringify(beaconData.content_attachment.calls_to_action),
      additional_metadata: JSON.stringify(beaconData.content_attachment.additional_metadata),
      location: st.geography(st.makePoint(beaconData.location.long, beaconData.location.lat)),
      is_virtual: beaconData.is_virtual
    });
}

module.exports = {
  createNewBeacon,
  createNewChannel,
};
