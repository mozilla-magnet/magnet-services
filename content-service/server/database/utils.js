const nodeUrl = require('url');
const resolveUrl = nodeUrl.resolve;
const nodePath = require('path');
const { shortIdToNum, numToShortId, } = require('../utils/shortid');
const SHORT_URLS = require('../../config.json').short_url;
const SHORT_URL = SHORT_URLS[0];

if (!SHORT_URL) {
  throw new Error('You must specify at least one short_url in the configuration file');
}

// Build a set of short URLs from the config, we can then test incoming
// requests based on membership in the set
const shortUrls = SHORT_URLS.reduce((set, shortUrl) => {
  set.add(asDomainAndProtocolKey(shortUrl));
  return set;
}, new Set());

// Take a URL and reduce it to a key based on the protocol and
// hostname - inclusive of port number
function asDomainAndProtocolKey(url) {
  const parsedUrl = nodeUrl.parse(url);
  return `${parsedUrl.protocol}://${parsedUrl.host}`;
}

function shortUrlToId(url) {
  const parsedUrl = nodeUrl.parse(url);
  const isShortUrl = shortUrls.has(asDomainAndProtocolKey(url));

  if (!isShortUrl) {
    return false;
  }

  return nodePath.basename(parsedUrl.pathname);
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

module.exports = function(knex) {
  const st = require('knex-postgis')(knex);

  function selectBeacons() {
    return knex('beacon')
      .select(
        'id', 'channel_name', 'canonical_url',
        'call_to_action', 'extra_metadata',
        st.asGeoJSON('location'), 'is_virtual');
  }

  return {
    selectBeacons,
    mapDatabaseResponseToApiResponse,
    shortUrlToId,
  };
};
