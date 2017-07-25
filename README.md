# commercetools-api-reference
Commercetools Platform API reference documentation

[![Build Status](https://travis-ci.org/commercetools/commercetools-api-reference.svg?branch=master)](https://travis-ci.org/commercetools/commercetools-api-reference)

## run internal consistency test
```
npm install
node bin/validate-sources.js > source-validation-results.md
node bin/explode-raml.js > consistency-validation-results.md
```
## run converter to OAS format
```
npm install
node bin/oas-convert.js
```


## Using RAML API Console 4

### Building the API console image

```bash
docker build . -t api_console
```

### Running the API Console image

```bash
docker run --rm -p8081:8081 api_console
```


## Using RAML API Console 3

### Building the API console image

```bash
docker build console -t api_console
```

### Running the API Console image

```bash
docker run --rm -p9000:9000 -p35729:35729 -v$(pwd):/apis api_console
```

### Running the static webserver only

```bash
docker run --rm -p9000:9000 -p35729:35729 -v$(pwd):/apis api_console grunt connect:livereload:keepalive
```
