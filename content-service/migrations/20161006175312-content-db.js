'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable('channel', {
    id: { type: 'bigint', primaryKey: true },
    name: { type: 'string' },
    email: { type: 'string' },
    tags: { type: 'string' }
  }).then(() => {
   return db.createTable('beacon', {
     id: { type: 'bigint' },
     content_id: { type: 'bigint' },
     location: { type: 'circle' },
     isVirtual: { type: 'boolean' },
   });
  }).then(() => {
    return db.createTable('content', {
      id: { type: 'bigint' },
      short_id: { type: 'string' },
      canonical_url: { type: 'string' },
      channel_id: { type: 'bigint' },
      // schedule?
    });
  });
};

exports.down = function(db) {
  return db.dropTable('channel');
};

exports._meta = {
  "version": 1
};
