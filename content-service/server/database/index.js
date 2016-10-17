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

function getAllBeaconsForChannel(channelName) {
  if (!(channelName && channelName.length)) {
    throw new HttpError(400, 'Must specify channel name in request');
  }

  return knex('beacon')
    .select('id')
    .where('channel_name', channelName)
    .then((response) => {
      return response.map((entry) => {
        return shortId.numToShortId(entry.id);
      });
    });
}

function searchBeacons(lat, long, radius) {

  // ST_MakePoint is (x,y) so reverse conventional 'lat, long' to 'long, lat'
  const point = st.makePoint(long, lat);

  return knex('beacon')
    .select('channel_name', 'id', st.asGeoJSON('location'))
    .where(st.dwithin('location', point, radius))
    .limit(100)
    .then((dbResponse) => {
      return dbResponse.map((entry) => {
        const parsedGeoJson = JSON.parse(entry.location);
        return {
          slug: shortId.numToShortId(entry.id),
          channel_name: entry.channel_name,
          location: {
            latitude: parsedGeoJson.coordinates[1],
            longitude: parsedGeoJson.coordinates[0],
          }
        };
      });
    });
}

function searchSlugs(slugs) {

  if (!Array.isArray(slugs)) {
    throw new HttpError(400, 'Request body must be an array', 'EINVAL');
  }

  if (slugs.length > 100) {
    throw new HttpError(400, 'Request body too large (limit of 100 items)', 'E2BIG');
  }

  if (slugs.length === 0) {
    return Promise.resolve({});
  }

  const resultsToReturn = slugs.reduce((obj, slug) => {
    obj[slug] = false;
    return obj;
  }, {});

  return knex('beacon')
    .select('channel_name', 'id', st.asGeoJSON('location'))
    .whereIn('id', slugs.map(shortId.shortIdToNum))
    .then((dbResponse) => {
      dbResponse.forEach((entry) => {
        const parsedGeoJson = JSON.parse(entry.location);
        const slug = shortId.numToShortId(entry.id);
        resultsToReturn[slug] = {
          channel_name: entry.channel_name,
          location: {
            latitude: parsedGeoJson.coordinates[1],
            longitude: parsedGeoJson.coordinates[0],
          }
        };
      });

      return resultsToReturn;
    });
};

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

/*
 * Returns a geojson representation of every point in the database,
 * must be authenticated, might take a while!
 */
function getAllPointsInDatabase() {
  return knex('beacon')
    .select('canonical_url', 'channel_name', st.asGeoJSON('location'))
    .then((response) => {
      return response.map((entry) => {
        return {
          type: 'Feature',
          properties: {
            url: entry.canonical_url,
            channel: entry.channel_name
          },
          geometry: JSON.parse(entry.location)
        };
      });
      return response;
    })
    .then((features) => {
      return {
        type: 'FeatureCollection',
        features,
      };
    });
}

module.exports = {
  createNewBeacon: beacons.create,
  createNewChannel: channels.create,
  getAllBeaconsForChannel,
  searchBeacons,
  getCanonicalUrlForShortId,
  searchSlugs,
  getAllPointsInDatabase,
  getBeaconInfo: beacons.read,
};
