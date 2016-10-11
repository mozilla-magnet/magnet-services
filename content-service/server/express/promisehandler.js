// Creates a wrapper around an express handler to allow promise usage and
// generic error handling.

module.exports = function createRouteHandler(handler) {
  return (req, res, next) => {
    const handlerPromise = handler(req, res);

    if ('catch' in handlerPromise) {
      handlerPromise.catch((err) => {
        next(err);
      });
    }

    return handlerPromise;
  };
};
