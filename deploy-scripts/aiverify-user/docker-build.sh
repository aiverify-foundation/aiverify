#!/bin/bash

docker build --build-arg ACCESS_TOKEN=$1 --build-arg UID=$(id -u) --build-arg GID=$(id -g) ${@:2} -t aiverify:0.9 .

