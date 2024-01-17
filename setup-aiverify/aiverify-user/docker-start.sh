#!/bin/bash

# User for mongo service
export CUR_UID=$(id -u)
export CUR_GID=$(id -g)

export MONGO_ROOT_PASSWORD=
export DB_AIVERIFY_USER=
export DB_AIVERIFY_PASSWORD=

[ ! -d "~/data/db" ] && mkdir -p ~/data/db
[ ! -d "~/logs/db" ] && mkdir -p ~/logs/db

echo "Starting aiverify containers..."
docker-compose up ${@:1}
