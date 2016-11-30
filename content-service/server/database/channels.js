const pgErrors = require('./pgerrors').names;
const HttpError = require('../express/httperror');
module.exports = function(knex) {

  function create(channelInfo) {
    return knex('channel')
      .insert({
        id: channelInfo.id,
        name: channelInfo.name,
        email: channelInfo.email,
        tags: channelInfo.tags || '',
      })
      .then((dbResponse) => {
        return { created: channelInfo.name };
      }).catch((err) => {
        if (Number(err.code) === pgErrors.UNIQUE_VIOLATION) {
          const matches = err.detail.match(/^.*\((.*)\)=\((.*)\).*$/);
          throw new HttpError(409, `Could not create channel with id, ${matches[1]} must be unique`, 'EINVAL');
        }

        throw err;
      });
  }

  function read() {
    return knex('channel')
      .select('id', 'name', 'tags')
      .limit(100)
      .then((dbResponse) => {
        return dbResponse.map((entry) => {
          return {
            id: entry.id,
            name: entry.name,
            tags: entry.tags,
          };
        });
      });
  }

  function truncateTable() {
    return knex('channel').delete();
  }

  function deleteChannel(channelName) {
    return knex('channel').where('name', channelName).delete();
  }

  return {
    create,
    read,
    deleteChannel,
    truncate: truncateTable,
  };
};
