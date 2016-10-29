const { waitForPg } = require('areyoubeingserved');
const environment = process.env.ENV || 'dev';
const dbConfig = require('../database.json')[environment.toLowerCase()];

module.exports = function() { return waitForPg(30, dbConfig)(); };
