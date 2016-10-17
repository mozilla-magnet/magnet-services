const cors = require('cors');
module.exports = function acao(config) {
  const acaoHosts = new Set(config.acaoList);
  const corsOptions = {
    origin: function(origin, callback) {
      const originAllowed = acaoHosts.has(origin);

      console.log('checking cors');
      callback(originAllowed ? null : 'Bad Request', originAllowed);
    },
    optionsSuccessStatus: 200
  };

  const corsHandler = cors(corsOptions);

  return function(req, res, next) {
    const origin = req.get('origin');
    if (origin) {
      if (acaoHosts.has(origin)) {
        res.set('Access-Control-Allow-Credentials', true);
      }

      return corsHandler(req, res, next);
    }

    next();
  };
};
