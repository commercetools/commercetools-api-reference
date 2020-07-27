# commercetools-api-reference
Commercetools Platform API reference documentation

:warning: Please note that this project is currently in the **ALPHA** version and is subject to change.


[![Build Status](https://travis-ci.org/commercetools/commercetools-api-reference.svg?branch=master)](https://travis-ci.org/commercetools/commercetools-api-reference)

## Postman

See [postman documentation](postman/)

## Swagger

Please use the [api.swagger.json](api.swagger.json)


## Development

### run internal consistency test
```
npm install
node bin/explode-raml.js > consistency-validation-results.md
```

### run converter to OAS format
```
npm install
node bin/oas-convert.js
```

### update the RAML types definition
```
docker run --rm -v${PWD}:/app -w /app php:7.1-alpine php bin/types.php
```

### run Postman collection generator
To generate the postman collection in `./postman/collection.json` perform the following tasks:
```
docker pull vrapio/rmf-generator
docker run --rm -v"$PWD":/api -v"$PWD":/out vrapio/rmf-generator -l postman /api/postman.raml
```
