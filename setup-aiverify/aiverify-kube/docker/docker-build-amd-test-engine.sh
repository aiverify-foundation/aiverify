#!/bin/bash

docker buildx build --platform linux/amd64 --progress=plain ${@:1} -t aiverify-test-engine:0.10-amd ./test-engine
