const HttpError = require('./httperror');

module.exports = function(err, req, res, next) {
  const headers = {
    'Content-Type': 'text/plain;charset=UTF-8',
    'Cache-Control': 'public, s-maxage=5, max-age=20',
  };

  let statusCode = 500;
  if (res.headersSent) {
    res.end();
    return;
  }

  if (err instanceof HttpError) {
    statusCode = err.statusCode;
  }

  let msg = '' + (err.message || err);

  if ('string' === typeof err.details) {
    msg += '\n' + err.details;
  }

  if (process.env.ENV.trim().toLowerCase() === 'dev') {
    msg += '\n\n===========================================================\n';
    msg += 'Stack (shown because ENV=dev):\n\n' + (err.stack || 'no stacktrace available ');
  }

  res.writeHead(statusCode, headers);
  res.end(msg);
};
