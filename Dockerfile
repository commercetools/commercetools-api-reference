FROM node:alpine

RUN mkdir /api_console

COPY *.raml package.json package-lock.json yarn.lock /api_console/
COPY examples /api_console/examples
COPY resources /api_console/resources
COPY securitySchemes /api_console/securitySchemes
COPY traits /api_console/traits
COPY types /api_console/types

WORKDIR /api_console

RUN apk add --no-cache --virtual .build-deps-api-console git \
    && yarn install \
    && yarn add api-console-cli@0.2.12 \
    && node_modules/.bin/api-console build ./update-actions.raml --json -t v4.0.0 \
    && apk del .build-deps-api-console

EXPOSE 8081

CMD ["node_modules/.bin/api-console", "serve", "-H", "0.0.0.0", "build"]
