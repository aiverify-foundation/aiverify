#!/bin/bash

export CUR_UID=$(id -u)
export CUR_GID=$(id -g)
echo "uid=$CUR_UID gid=$CUR_GID"
echo "Stopping containers..."

docker compose stop
