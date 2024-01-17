#!/bin/bash

# Generate random passwords
db_aiverify_user=$(openssl rand -hex 8)
db_aiverify_password=$(openssl rand -hex 16)
mongo_root_password=$(openssl rand -hex 16)

echo "DB_AIVERIFY_USER: $db_aiverify_user"
echo "DB_AIVERIFY_PASSWORD: $db_aiverify_password"
echo "MONGO_ROOT_PASSWORD: $mongo_root_password"

file_path="docker-start.sh"
sed -i '' "s/export DB_AIVERIFY_USER.*/export DB_AIVERIFY_USER=\"$db_aiverify_user\"/" "$file_path"
sed -i '' "s/export DB_AIVERIFY_PASSWORD.*/export DB_AIVERIFY_PASSWORD=\"$db_aiverify_password\"/" "$file_path"
sed -i '' "s/export MONGO_ROOT_PASSWORD.*/export MONGO_ROOT_PASSWORD=\"$mongo_root_password\"/" "$file_path"

docker build --build-arg MONGO_USER=${db_aiverify_user} \
             --build-arg MONGO_PASSWORD=${db_aiverify_password} \
             ${@:1} -t aiverify:0.10 .

