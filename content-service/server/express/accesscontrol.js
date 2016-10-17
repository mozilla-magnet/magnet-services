const cors = require('cors');
module.exports = function acao(config) {
  const acaoHosts = new Set(config.acaoList);
  const corsOptions = {
    origin: function(origin, callback) {
      const originAllowed = acaoHosts.has(origin) || origin === undefined;
      callback(originAllowed ? null : 'Bad Request', originAllowed);
    },
    optionsSuccessStatus: 200,
    credentials: true,
    exposedHeaders: ['content-type', 'content-range']
  };

  return cors(corsOptions);
};
