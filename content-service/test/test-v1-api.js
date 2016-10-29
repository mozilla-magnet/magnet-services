const {
  startServices, stopServices,
  waitForPostgres, runMigrations,
} = require('./init');

const request = require('supertest-as-promised');
const app = require('../server/app');
const {
  api_key: API_KEY,
  short_url: SHORT_URL,
} = require('../config.json');
const path = require('path');
const nodeUrl = require('url');

const authHeaderBase64 = new Buffer(`apikey:${API_KEY}`)
  .toString('base64');
const authHeader = `Basic ${authHeaderBase64}`;

describe('API', function() {
  this.timeout(200000);
  let database;

  before(function() {
    return startServices()
      .then(waitForPostgres)
      .then(runMigrations)
      .then(() => {
        database = require('../server/database');
        return database.beacons.truncate()
          .then(database.channels.truncate);
      });
  });

  beforeEach(function() {
    return database.channels.create({
      name: 'testchannel',
      email: 'test@mozilla.com',
      tags: '',
    });
  });

  afterEach(function() {
    return database.channels.truncate();
  });


  describe('/channel', function() {
    describe('POST', function() {
      it('should return a success code if the request is valid', function() {
        return request(app)
          .post('/v1/channel')
          .set('Content-Type', 'application/json')
          .set('Authorization', authHeader)
          .send({
            name: 'test',
            email: 'test@example.com',
            tags: '',
          })
          .expect(200)
          .expect('Content-Type', /application\/json/);
      });
    });

    describe('GET', function() {
      it('should return a list of all channels', function() {
        return request(app)
          .get('/v1/channel')
          .set('Content-Type', 'application/json')
          .set('Authorization', authHeader)
          .expect(200)
          .expect('Content-Type', /application\/json/)
          .expect([{
            id: 'testchannel',
            name: 'testchannel',
            tags: '',
          }]);
      });
    });
  });

  // Not implemented
  describe.skip('/channel/:channel_name', function() {
    describe('GET', function() {});
  });

  describe('/channel/:channel_name/beacons', function() {
    describe('POST', function() {
      it('should return a success code if the request is valid', () => {
        return request(app)
          .post('/v1/channel/testchannel/beacons')
          .set('Content-Type', 'application/json')
          .set('Authorization', authHeader)
          .send({
            location: {
              lat: 10,
              long: 11,
            },
            is_virtual: true,
            content_attachment: {
              url: 'https://pm0.io/1',
              calls_to_action: {
                test: 'https://pm0.io/2',
              }
            },
            additional_metadata: {}
          })
          .expect('Content-Type', /application\/json/)
          .expect(200);
      });
    });

    describe('GET', function() {
      it('should return all the beacons for this channel', () => {
        return database.beacons.create('testchannel', {
          location: {
            lat: 10,
            long: 11,
          },
          is_virtual: true,
          content_attachment: {
            url: 'https://pm0.io/1',
            calls_to_action: {
              test: 'https://pm0.io/2',
            }
          },
          additional_metadata: {}
        }).then(({ shortId, }) => {
          return request(app)
            .get('/v1/channel/testchannel/beacons')
            .set('Authorization', authHeader)
            .expect(200)
            .expect('Content-Type', /application\/json/)
            .expect([{
              id: shortId,
              short_url: nodeUrl.resolve(SHORT_URL, shortId),
              channel: 'testchannel',
              location: {
                latitude: 10,
                longitude: 11,
              },
              is_virtual: true,
              url: 'https://pm0.io/1',
              call_to_action: {
                  test: 'https://pm0.io/2',
              },
              extra_metadata: {}
            }]);
        });
      });
    });
  });

  describe('/channel/:channel_name/beacons/:slug', function() {
    describe('GET', function() {
      it('should get the beacon information for a specific beacon', () => {
        return database.beacons.create('testchannel', {
          location: {
            lat: 10,
            long: 11,
          },
          is_virtual: true,
          content_attachment: {
            url: 'https://pm0.io/1',
            calls_to_action: {
              test: 'https://pm0.io/2',
            }
          },
          additional_metadata: {}
        }).then(({ shortId, }) => {
          return request(app)
            .get(path.join('/v1/channel/testchannel/beacons/', shortId))
            .set('Authorization', authHeader)
            .expect(200)
            .expect({
              id: shortId,
              short_url: nodeUrl.resolve(SHORT_URL, shortId),
              channel: 'testchannel',
              location: {
                latitude: 10,
                longitude: 11,
              },
              is_virtual: true,
              url: 'https://pm0.io/1',
              call_to_action: {
                  test: 'https://pm0.io/2',
              },
              extra_metadata: {}

            });
        });
      });
    });
    describe('PATCH', function() {});
  });

  describe('/search/url', function() {
    describe('POST', function() {
      it('should get the beacon information for all posted URLs', () => {
        return database.beacons.create('testchannel', {
          location: {
            lat: 10,
            long: 11,
          },
          is_virtual: true,
          content_attachment: {
            url: 'https://example.com/coolsite',
            calls_to_action: {}
          },
          additional_metadata: {}
        }).then(({ shortId, }) => {
          const shortUrl = nodeUrl.resolve(SHORT_URL, shortId)
          return request(app)
            .post('/v1/search/url')
            .set('Authorization', authHeader)
            .send([
              nodeUrl.resolve(SHORT_URL, shortId)
            ])
            .expect(200)
            .expect([
              {
                id: shortId,
                short_url: shortUrl,
                channel: 'testchannel',
                location: {
                  latitude: 10,
                  longitude: 11,
                },
                is_virtual: true,
                url: 'https://example.com/coolsite',
                call_to_action: {},
                extra_metadata: {}
              }
            ]);
        });
      });
    });
  });

  after(() => {
    return stopServices();
  });
});
