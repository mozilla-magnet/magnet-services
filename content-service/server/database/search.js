const { shortIdToNum, numToShortId, } = require('../utils/shortid');
const HttpError = require('../express/httperror');
const utils = require('./utils');

module.exports = function(knex) {
  const st = require('knex-postgis')(knex);

  function searchBeacons(lat, long, radius) {

    // ST_MakePoint is (x,y) so reverse conventional 'lat, long' to 'long, lat'
    const point = st.makePoint(long, lat);

    return utils.selectBeacons(knex)
      .where(st.dwithin('location', point, radius))
      .limit(100)
      .then((dbResponse) => {
        return dbResponse
          .map(utils.mapDatabaseResponseToApiResponse)
          // For backwards compatibility duplicate some fields with their old
          // names
          .map((beacon) => {
            beacon.slug = beacon.id;
            beacon.channel_name = beacon.channel;
            return beacon;
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
      .whereIn('id', slugs.map(shortIdToNum))
      .then((dbResponse) => {
        dbResponse.forEach((entry) => {
          const parsedGeoJson = JSON.parse(entry.location);
          const slug = numToShortId(entry.id);
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

  return {
    beaconsByLocation: searchBeacons,
    slugs: searchSlugs,
    allPoints: getAllPointsInDatabase,
  };
};
