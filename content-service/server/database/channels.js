const pgErrors = require('./pgerrors').names;
const HttpError = require('../express/httperror');
module.exports = function(knex) {

  function create(channelInfo) {
    return knex('channel')
      .insert({
        name: channelInfo.name,
        email: channelInfo.email,
        tags: channelInfo.tags || '',
      })
      .then((dbResponse) => {
        return { created: channelInfo.name };
      }).catch((err) => {
        if (Number(err.code) === pgErrors.UNIQUE_VIOLATION) {
          const matches = err.detail.match(/^.*\((.*)\)=\((.*)\).*$/);
          throw new HttpError(409, `Could not create channel, ${matches[1]} must be unique`, 'EINVAL');
        }

        throw err;
      });
  }

  function read() {
    return knex('channel')
      .select('name', 'tags')
      .limit(100)
      .then((dbResponse) => {
        return dbResponse.map((entry) => {
          return {
            id: entry.name,
            name: entry.name,
            tags: entry.tags,
          };
        });
      });
  }

  return {
    create,
    read,
  };
};
