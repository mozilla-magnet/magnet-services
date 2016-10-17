const cors = require('cors');
module.exports = function acao(config) {
  const acaoHosts = new Set(config.acaoList);
  const corsOptions = {
    origin: function(origin, callback) {
      const originAllowed = acaoHosts.has(origin);

      console.log('checking cors');
      console.log(callback.toString());
      callback(originAllowed ? null : 'Bad Request', originAllowed);
    },
    optionsSuccessStatus: 200,
    credentials: true,
    exposedHeaders: ['content-type', 'content-range']
  };

  const corsHandler = cors(corsOptions);

  return corsHandler;
};
