#!/bin/bash

# User for mongo service
export CUR_UID=$(id -u)
export CUR_GID=$(id -g)

# Check if username and password are provided
if [ -z "$DB_AIVERIFY_USERNAME" ] || [ -z "$DB_AIVERIFY_PASSWORD" ]; then
    # Prompt user for username
    read -p "Enter user name: " DB_AIVERIFY_USERNAME

    # Prompt user for password
    read -s -p "Enter password: " DB_AIVERIFY_PASSWORD
    echo

    # echo "User name and password are required. Aborting aiverify containers start-up..."
    # exit 1
fi

export DB_AIVERIFY_USER="$DB_AIVERIFY_USERNAME"
export DB_AIVERIFY_PASSWORD="$DB_AIVERIFY_PASSWORD"
export MONGO_ROOT_PASSWORD="$DB_AIVERIFY_PASSWORD"

[ ! -d "~/data/db" ] && mkdir -p ~/data/db
[ ! -d "~/logs/db" ] && mkdir -p ~/logs/db

echo "Starting up aiverify containers..."
docker-compose up ${@:1}
