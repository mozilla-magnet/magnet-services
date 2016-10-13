# Magnet Services

This repository contains various backend services for _Project Magnet_, each to be orchestrated via `docker-compose`.  For more information on each component, see each respective README.

To start all services, run `docker-compose up`.  If the code is changed for a component, its docker image will need to be rebuilt.  This can be achieved by running `docker-compose build <servicename>`.

### Content Database (service name: `db`)

The PostGIS database running in a container.

`docker-compose up db`

Locally exposed on `localhost:5432`.

### Content Service (service name: `content`)

See [content-service/README](https://github.com/mozilla-magnet/magnet-services/tree/master/content-service)

`docker-compose up content`

Locally exposed on `localhost:3000`.

### Shortener Service (service name: `shortener`)

See [magnet-shortener/README](https://github.com/mozilla-magnet/magnet-shortener)

`docker-compose up shortener`

Locally exposed on `localhost:3001`.

## Deploying to Production

1. Head to the 'production' server and switch to the 'metadataservice' user.
2. Enter the `magnet-services` directory and do a git pull.
3. Run `./update-prod.sh <... list of service names to restart>`

# License

All code licensed under the MPL-2.0 license.
