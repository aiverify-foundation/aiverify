#!/bin/bash

docker buildx build --platform linux/amd64 --progress=plain ${@:1} -t aiverify-portal:0.10-amd64 ./portal

