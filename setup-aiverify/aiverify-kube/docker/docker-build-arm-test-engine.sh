#!/bin/bash

docker buildx build --platform linux/arm64 --progress=plain ${@:1} -t aiverify-test-engine:0.10-arm ./test-engine
