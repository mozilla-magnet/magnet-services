const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const passport = require('passport');
const authconfig = require('../../config.json');
const createRouteHandler = require('../express/promisehandler');

const database = require('../database');

router.use(bodyParser.json());

const LocalApiKeyStrategy = require('passport-localapikey-update').Strategy;

passport.use(new LocalApiKeyStrategy({
    apiKeyHeader: 'x-apikey'
  },
  function(apiKey, done) {
    if (apiKey.trim() === authconfig.apiKey.trim()) {
      done(null, {});
    } else {
      done(new Error("Invalid API key"));
    }
  }
));

router.post(/^\/v1\/channel\/?$/,
  passport.authenticate('localapikey', { session: false }),
  createRouteHandler((req, res) => {

  const requestBody = req.body;
  return database.createNewChannel(requestBody)
    .then((dbResponse) => {
      res.json(dbResponse);
    });
}));

router.post(/^\/v1\/channel\/(.*)\/beacons\/?$/,
  passport.authenticate('localapikey', { session: false }),
  createRouteHandler((req, res) => {

  const channelName = req.params[0];
  const requestBody = req.body;
  return database.createNewBeacon(channelName, requestBody)
    .then((dbResponse) => {
      res.json(dbResponse);
    });

}));


router.get(/^\/v1\/channel\/(.*)\/beacons\/?$/, createRouteHandler((req, res) => {
  const channelName = req.params[0];
  res.json(req.params);
}));

router.post(/^\/v1\/search\/beacons\/?$/, createRouteHandler((req, res) => {
  res.json({});
}));

router.get(/^\/v1\/search\/shortid\/([a-zA-Z0-9_\-~]*)\/?$/, createRouteHandler((req, res) => {
  const shortId = req.params[0];

  return database.getCanonicalUrlForShortId(shortId)
    .then((response) => {
      res.json(response);
    });
}));

router.get(/^\/v1\/search\/beacons\/(.*),(.*),(.*)\/?$/, createRouteHandler((req, res) => {
  const latitude = Number(req.params[0]);
  const longitude = Number(req.params[1]);
  const radius = Number(req.params[2]);

  return database.searchBeacons(latitude, longitude, radius)
    .then((dbResponse) => {
      res.json(dbResponse);
    });
}));

router.post(/^\/v1\/search\/slugs\/?$/, createRouteHandler((req, res) => {
  const requestBody = req.body;

  return database.searchSlugs(requestBody)
    .then((response) => {;
      res.json(response);
    });
}));

router.get(/^\/v1\/search\/allbeacons\/?$/,
  passport.authenticate('localapikey', { session: false }),
  createRouteHandler((req, res) => {

  return database.getAllPointsInDatabase()
    .then((response) => {
      res.json(response);
    });
}));

module.exports = router;
