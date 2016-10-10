# Content Service

TO run locally for dev: `npm run-script start-dev`. Make sure the database is
up or configured in `databsae.json`, see the top level README for starting the
databse.

## API

#### POST /v1/channel

Authenticate with an api key set in the `X-ApiKey` header.

#### POST /v1/channel/<name>/beacons

Authenticate with an api key set in the `X-ApiKey` header.

Creates a new `beacon` resource.

Body must be content type `application/json` and contain the following fields
(see comments for optional fields):

```JSON
{
  location: { lat: <number>, long: <number> }, // Optional unless is_virtual is
  true
  is_virtual: <boolean>,
  short_id: <string>, // Optional: Will assign this as the shortend ID for this
  beacon, if omitted, a new one will be generated.
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

#### GET /v1/channel/<name>/beacons

Get a list of all beacons belonging to this channel.

TODO: Pagination

#### GET /v1/search/beacons/<latitude>,<longitude>,<radius>

Get a list of all beacons within a certain radius of the given latitude and
longitude.
