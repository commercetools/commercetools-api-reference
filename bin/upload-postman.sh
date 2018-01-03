#!/bin/bash
set -e

COLLECTION_NAME=`jq -r .info.name postman/collection.json`
COLLECTION_ID=`curl --request GET --url https://api.getpostman.com/collections --header "x-api-key: ${POSTMAN_API_KEY}" | jq -r ".collections[] | select(.name==\"${COLLECTION_NAME}\") | .id"`
echo ${COLLECTION_NAME}
echo ${COLLECTION_ID}

ENVIRONMENT_NAME=`jq -r .name postman/template.json`
ENVIRONMENT_ID=`curl --request GET --url https://api.getpostman.com/environments --header "x-api-key: ${POSTMAN_API_KEY}" | jq -r ".environments[] | select(.name==\"${ENVIRONMENT_NAME}\") | .id"`
echo ${ENVIRONMENT_NAME}
echo ${ENVIRONMENT_ID}

jq "{ collection: . } | .collection.info._postman_id = \"${COLLECTION_ID}\"" postman/collection.json > dummy-collection.json
jq "{ environment: . } | .environment.id = \"${ENVIRONMENT_ID}\"" postman/template.json > dummy-template.json

if [ -z ${ENVIRONMENT_ID} ]; then
    curl -XPOST -f --url https://api.getpostman.com/environments --header 'content-type: application/json' --header "x-api-key: ${POSTMAN_API_KEY}" --data @dummy-template.json
else
    curl -XPUT -f --url https://api.getpostman.com/environments/${ENVIRONMENT_ID} --header 'content-type: application/json' --header "x-api-key: ${POSTMAN_API_KEY}" --data @dummy-template.json
fi
if [ -z ${COLLECTION_ID} ]; then
    curl -XPOST -f --url https://api.getpostman.com/collections --header 'content-type: application/json' --header "x-api-key: ${POSTMAN_API_KEY}" --data @dummy-collection.json
else
    curl -XPUT -f --url https://api.getpostman.com/collections/${COLLECTION_ID} --header 'content-type: application/json' --header "x-api-key: ${POSTMAN_API_KEY}" --data @dummy-collection.json
fi
