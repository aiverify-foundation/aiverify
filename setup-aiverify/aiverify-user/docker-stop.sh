#!/bin/bash

export CUR_UID=$(id -u)
export CUR_GID=$(id -g)

echo "Stopping aiverify containers..."

docker-compose stop
