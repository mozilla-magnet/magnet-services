const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

router.use(bodyParser.json());

router.post(/^\/v1\/channel\/(.*)\/beacons/, (req, res) => {
  const channelName = req.params[0];
  const requestBody = req.body;
  console.log(requestBody);
  console.log(`channelName=${channelName}`);
  res.json(requestBody)
});

router.get(/^\/v1\/channel\/(.*)\/beacons/, (req, res) => {
  const channelName = req.params[0];
  res.json(req.params);
});

router.get(/^\/v1\/search\/(.*),(.*),(.*)/, (req, res) => {
  const latitude = req.params[0];
  const longitude = req.params[1];
  const radius = req.params[2];
  res.json(req.params);
});

module.exports = router;
