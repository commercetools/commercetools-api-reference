# sphere-api-reference
Commercetools Platform API reference documentation

## run internal consistency test
```
npm install
node bin/validate-sources.js > source-validation-results.md
node bin/explode-raml.js -> consistency-validation-results.md
```

## run validation against SPHERE API

## Using RAML API Console

### Building the API console image

```bash
docker build . -t api_console
```

### Running the API Console image

```bash
docker run --rm -p9000:9000 -p35729:35729 -v$(pwd):/apis api_console
```

### Running the static webserver only

```bash
docker run --rm -p9000:9000 -p35729:35729 -v$(pwd):/apis api_console grunt connect:livereload:keepalive
```
