const express = require('express');
const router = express.Router();

router.get('/__gtg', (req, res) => {
  res.type("text/plain;charset=utf-8");
  res.set("Cache-Control", "no-cache");
  res.send("OK");
});

module.exports = router;
