FROM ruby:2.4-alpine

ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_VERSION 7.5.0

RUN adduser -D -u 1000 node \
    && apk add --no-cache \
        libstdc++ \
    && apk add --no-cache --virtual .build-deps \
        binutils-gold \
        curl \
        g++ \
        gcc \
        gnupg \
        libgcc \
        linux-headers \
        make \
        python \
  && for key in \
    9554F04D7259F04124DE6B476D5A82AC7E37093B \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
  ; do \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
  done \
    && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION.tar.xz" \
    && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
    && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
    && grep " node-v$NODE_VERSION.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
    && tar -xf "node-v$NODE_VERSION.tar.xz" \
    && cd "node-v$NODE_VERSION" \
    && ./configure \
    && make -j$(getconf _NPROCESSORS_ONLN) \
    && make install \
    && apk del .build-deps \
    && cd .. \
    && rm -Rf "node-v$NODE_VERSION" \
    && rm "node-v$NODE_VERSION.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt

COPY client-oauth2.js /tmp/client-oauth2.js

RUN apk update \
    && apk add ca-certificates wget git \
    && update-ca-certificates \
    && gem install sass \
    && npm install -g grunt-cli bower --save-dev \
    && git clone -b ${API_CONSOLE_VERSION:-v3.0.14} --depth 1 --single-branch https://github.com/mulesoft/api-console.git  /api-console \
    && cd /api-console \
    && mv /tmp/client-oauth2.js /api-console/src/vendor/client-oauth2/client-oauth2.js \
    && npm install \
    && bower --allow-root install \
    && grunt build \
    && mkdir -p /api-console/dist/apis \
    && mv /api-console/dist/examples/simple.raml /api-console/dist/apis/api.raml \
    && sed -i 's/<raml-initializer><\/raml-initializer>/<raml-console-loader src="apis\/api.raml" options="{ disableRamlClientGenerator: true }"><\/raml-console-loader>/g' /api-console/dist/index.html \
    && ln -sf /api-console/dist/apis /apis

WORKDIR /api-console

# for live reload
EXPOSE 35729

# for http
EXPOSE 9000
CMD ["grunt", "connect:livereload", "watch"]
