const app = require('./app');

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
