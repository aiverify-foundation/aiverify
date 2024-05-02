#!/bin/bash

docker buildx build --platform linux/arm64 --progress=plain ${@:1} -t aiverify-portal:0.10-arm ./portal

