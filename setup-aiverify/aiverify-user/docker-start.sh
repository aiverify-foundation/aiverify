#!/bin/bash

# User for mongo service
export CUR_UID=$(id -u)
export CUR_GID=$(id -g)

export MONGO_ROOT_PASSWORD="48a93c85e92d9c107a356d583969466c"
export DB_AIVERIFY_USER="3c82d11255cf9fab"
export DB_AIVERIFY_PASSWORD="f352d9ca304fe2772e2fbe42b96985b9"

[ ! -d "~/data/db" ] && mkdir -p ~/data/db
[ ! -d "~/logs/db" ] && mkdir -p ~/logs/db

echo "Starting aiverify containers..."
docker-compose up ${@:1}
