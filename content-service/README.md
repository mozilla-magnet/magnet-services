# Content Service

This service exposes information about beacons, and their associated content,
and channels.


## With Docker

The easiest way to get started is to go to the root of the `magnet-services`
directory, and run `docker compose up`.  If you make a change to the code,
you'll need to rebuild the container image if you're running inside a
container.

## Without Docker

To run locally for development use: `npm run-script start-dev`, this will start
the server outside of a container and run `nodemon`. Make sure the database is
up and configured in `database.json`, see the top level README for instructions
on starting a database for development.

## Migrations

Migrations use `db-migrate`. Ensure `database.json`
has the correct connection info for your environment and run `db-migrate up`.

This is done for you if you use `npm start`.

## API

### Authentication

Authentication is with Basic Auth.  The default username is 'apikey' and the
password is defined as `api_key` in the `config.json` file. This is subject to
change. Not all end points require auth.

#### GET `/v1/channel`

Get a list of all channels.

#### POST `/v1/channel`

Must be authenticated.

Creates a new `channel`.

Body must be content type `application/json` and contain the following fields:

```JS
{
  name: '<unique name of channel>',
  email: '<unique email address>',
  tags: '<associated descriptive tags:optional>'
}
```

#### POST `/v1/channel/:name/beacons`

Must be authenticated.

Creates a new `beacon` resource.

Body must be content type `application/json` and contain the following fields
(see comments for optional fields):

```JS
{
  location: { lat: <number>, long: <number> }, // Optional unless is_virtual is
  true
  is_virtual: <boolean>,
  content_attachment: {
    url: <string>,
    calls_to_action: {
      "<name>": "<url>",
      ...
    },
    additional_metadata: {}
  }
}
```

If `short_id` already exists, a `409 Conflict` error code will be returned.

#### GET `/v1/channel/:name/beacons`

Get a list of all beacons belonging to this channel.

TODO: Pagination

#### GET `/v1/channel/:name/beacons/:slug`

Get information about a beacon.

```JS
{
  id: <string>,
  short_url: <string>,
  channel: <string>,
  url: <string>,
  call_to_action: <object>,
  extra_metadata: <object>,
  location:  {
    latitude: <number>,
    longitude: <number>
  },
  is_virtual: <boolean>
}
```

#### PATCH `/v1/channel/:name/beacons/:slug`

Patch update a beacon, supported patch properties:

```JS
{
  location: { latitude: <number>, longitude: <number> },
  url: <string>
}
```

#### GET `/v1/search/beacons/:latitude,:longitude,:radius`

Get a list of all beacons within a certain radius of the given latitude and
longitude.

TODO: Pagination

#### GET `/v1/search/shortid/:slug`

Get the canonical URL for a given slug

Returns `application/json`:

```JS
{ channl_name: '<channel_name>', canonical_url: '<url>' }
```

#### POST `/v1/search/slugs`

Get information for a list of `slugs`.

Post a JSON encoded array of slugs (`application/json`)

```JS
["1", "1lm", "123dq"]
```

Responds with `application/json` matching requested slugs to an object, with
its information, or `false` if the slug is unknown.

Example:

```JS
{
  "1": false,
  "1lm": {
    "channel_name": "londontest",
    "location": { "latitude": 10.23123, "longitude": 50.12311 }
  },
  "123dq": {
    "channel_name": "londonstuff",
    "location": { "latitude": 2.12313, "longitude": 0.43563 }
  }
}
```

#### GET `/v1/search/url`

Must be authenticated.

Post a JSON encoded array of URLs (`application/json`)

```JS
[ "http://test.com/2", "http://test2.com/3/2/1" ]
```

Responds with an `application/json` array for all URLs that have corresponding
entries, if a URL is not in the database, it responds with nothing.

#### GET `/v1/search/allbeacons`

Must be authenticated.

Returns a GeoJSON format `FeatureCollection` object containing all points in
the database.

Responds with `application/json`.

A good way to visualise this is to create a GitHub Gist with the `geojson` file
extension, it will then be rendered for you.

