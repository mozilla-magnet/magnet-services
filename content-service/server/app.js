const express = require('express');
const morgan = require('morgan');
const app = express();

const ONE_DAY = 60 * 60 * 24;
const ONE_YEAR = ONE_DAY * 365;

app.use(morgan('combined'));
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.set('Strict-Transport-Security', `max-age=${ONE_DAY}; includeSubDomains`);
  return next();
});

app.use(require('./routes/ops'));
app.use(require('./routes/api'));

// Error handling
app.use(require('./express/errorhandler'));

module.exports = app;
