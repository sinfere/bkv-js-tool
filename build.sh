#!/bin/bash

set -e
set -o pipefail

/bin/rm -rf dist/
yarn build
/bin/rm -rf container/app/*
/bin/cp -f -R dist/ container/app/

cd container

image=di.sinfere.com/app/bkv/js-tool

docker buildx build --platform linux/amd64  --rm -t ${image} .
docker push ${image}

/bin/rm -rf app/*
