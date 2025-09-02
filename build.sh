#!/bin/bash

set -e
set -o pipefail

default_tag=stable
tag=$default_tag

if [[ -n "$1" ]]; then
    tag=$1
fi

if [[ "stable|latest" != *"${tag}"* ]];then
    echo "invalid build_tag: $tag"
    exit 0
fi

echo "tag: $tag"

/bin/rm -rf dist/
yarn build
/bin/rm -rf container/app/*
/bin/cp -f -R dist/ container/app/

cd container

image=di.sinfere.com/app/bkv/js-tool:$tag

echo "image: $image"

docker buildx build --platform linux/amd64  --rm -t ${image} .
docker push ${image}

/bin/rm -rf app/*
