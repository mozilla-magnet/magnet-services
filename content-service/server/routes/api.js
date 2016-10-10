const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const passport = require('passport');
const authconfig = require('../../config.json');

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
  (req, res) => {

  const requestBody = req.body;
  console.log('body: ' + req.body);
  return database.createNewChannel(requestBody)
    .then((dbResponse) => {
      res.json(dbResponse);
    })
    .catch((err) => {
      res.status(400);
      res.json(err);
    });
});

router.post(/^\/v1\/channel\/(.*)\/beacons\/?$/,
  passport.authenticate('localapikey', { session: false }),
  (req, res) => {
  const channelName = req.params[0];
  const requestBody = req.body;
  console.log('body=' + requestBody);
  console.log(`channelName=${channelName}`);
  return database.createNewBeacon(channelName, requestBody)
    .then((dbResponse) => {
      res.json(dbResponse);
    })
    .catch((err) => {
      res.status(400);
      res.json(err);
    });
});

router.get(/^\/v1\/channel\/(.*)\/beacons/, (req, res) => {
  const channelName = req.params[0];
  res.json(req.params);
});

router.get(/^\/v1\/search\/beacons\/(.*),(.*),(.*)\/?$/, (req, res) => {
  const latitude = Number(req.params[0]);
  const longitude = Number(req.params[1]);
  const radius = Number(req.params[2]);

  return database.searchBeacons(latitude, longitude, radius)
    .then((dbResponse) => {
      res.json(dbResponse);
    }).catch((err) => {
      res.status(400);
      res.json(err);
    });
});

module.exports = router;
