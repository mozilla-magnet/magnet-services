const { shortIdToNum, numToShortId, } = require('../utils/shortid');
const SHORT_URL = require('../../config.json').short_url;
const nodeUrl = require('url');
const resolveUrl = nodeUrl.resolve;
const PARSED_SHORT_URL = Object.freeze(nodeUrl.parse(SHORT_URL));
const nodePath = require('path');

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

function selectBeacons(knex) {
  const st = require('knex-postgis')(knex);

  return knex('beacon')
    .select(
      'id', 'channel_name', 'canonical_url',
      'call_to_action', 'extra_metadata',
      st.asGeoJSON('location'), 'is_virtual');
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

module.exports = {
  selectBeacons,
  mapDatabaseResponseToApiResponse,
  shortUrlToId,
};
