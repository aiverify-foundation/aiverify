#!/bin/bash

# Pull aiverify image from Github Container Registry (ghcr) to local registry
docker pull ghcr.io/aiverify-foundation/aiverify:0.9
if [[ ! $(docker images -q aiverify:0.9) = "" ]]; then
  docker rmi aiverify:0.9
fi
docker tag ghcr.io/aiverify-foundation/aiverify:0.10 aiverify:0.10
docker rmi ghcr.io/aiverify-foundation/aiverify:0.10
