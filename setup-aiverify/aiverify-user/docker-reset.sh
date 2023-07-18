#!/bin/bash

export CUR_UID=$(id -u)
export CUR_GID=$(id -g)
echo "uid=$CUR_UID gid=$CUR_GID"

echo "Resetting container environment..."
echo "This script requires sudo permission"
sudo -v
sudo rm -rf ~/data
sudo rm -rf ~/uploads
sudo rm -rf ~/logs
mkdir -p ~/data/db
mkdir -p ~/uploads/data
mkdir -p ~/uploads/model
mkdir -p ~/logs/db
mkdir -p ~/logs/test-engine
docker-compose down --volumes
