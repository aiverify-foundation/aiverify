#!/bin/bash

export CUR_UID=$(id -u)
export CUR_GID=$(id -g)

while true; do
    echo "WARNING! This will delete all datasets, models, 3rd party plugins, templates and projects"
    read -p "Are your sure you want to proceed? [y/n] " yn
    case $yn in
        [Yy]* ) read -p "Please enter 'reset' to confirm: " userInput;
                if [[ "$userInput" == "reset" ]]; then
                    break;
                else
                    echo "Reset aborted";
                    exit;
                fi;;
        [Nn]* ) echo "Reset aborted";
                exit;;
        * ) echo "Please answer yes or no.";;
    esac
done

echo "Resetting aiverify container environment..."
rm -rf ~/data
rm -rf ~/logs
mkdir -p ~/data/db
mkdir -p ~/logs/db
docker-compose down --volumes

echo "aiverify container environment reset completed"