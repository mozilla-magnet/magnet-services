const express = require('express');
const morgan = require('morgan');
const app = express();

const ONE_DAY = 60 * 60 * 24;
const ONE_YEAR = ONE_DAY * 365;

app.use(morgan('combined'));
app.use((req, res, next) => {
  res.set('Strict-Transport-Security', `max-age=${ONE_DAY}; includeSubDomains`);
  res.removeHeader('x-powered-by');
  return next();
});

app.use(require('./routes/ops'));
app.use(require('./routes/api'));

function startService(port) {
  return new Promise((resolve, reject) => {
    app.listen(port, (err) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(app);
      }
    }).on('error', (err) => {
      return reject(err);
    }).on('clientError', (ex, socket) => {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
    });
  })
}

module.exports = startService;
