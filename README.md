# commercetools-api-reference
Commercetools Platform API reference documentation

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

## Using RAML API Console

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
