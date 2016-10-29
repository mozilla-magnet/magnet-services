const environment = process.env.ENV || 'dev';
const dbConfig = require('../../database.json')[environment.trim().toLowerCase()];

const shortId = require('../utils/shortid');

const HttpError = require('../express/httperror');

const knex = (function createPool() {
  const knex = require('knex')({
    client: 'pg',
    connection: dbConfig,
    pool: { min: 1, max: 10 }
  });

  return knex;
}());

const st = require('knex-postgis')(knex);
const channels = require('./channels')(knex);
const beacons = require('./beacons')(knex);
const search = require('./search')(knex);

function getCanonicalUrlForShortId(id) {
  // SG:NOTE: Replace this with getBeaconInfo(id)
  return knex('beacon')
    .select('channel_name', 'canonical_url')
    .where('id', shortId.shortIdToNum(id))
    .limit(1)
    .then((response) => {
      if (response.length > 0) {
        return response[0];
      }

      throw new HttpError(404, `Could not find short url: ${id}`, 'ENOTFOUND');
    });
}


module.exports = {
  createNewBeacon: beacons.create,
  createNewChannel: channels.create,
  getAllBeaconsForChannel: beacons.getAllForChannel,
  searchBeacons: search.beaconsByLocation,
  getCanonicalUrlForShortId,
  searchSlugs: search.slugs,
  getAllPointsInDatabase: search.allPoints,
  getBeaconInfo: beacons.read,
  beacons,
  channels,
};
