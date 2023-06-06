#!/bin/bash

export CUR_UID=$(id -u)
export CUR_GID=$(id -g)
echo "uid=$CUR_UID gid=$CUR_GID"

echo "Resetting container environment..."
rm -rf ~/data
rm -rf ~/uploads
mkdir -p ~/data/db
mkdir -p ~/uploads/data
mkdir -p ~/uploads/model
docker-compose down --volumes
