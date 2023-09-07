#!/bin/bash

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

echo "Resetting aiverify developer environment..."

echo "Cleanup database..."
mongosh aiverify --quiet --eval "db.dropDatabase()"

echo "Cleanup redis cache..."
redis-cli flushall

echo "Delete datasets, models and logs..."
rm -f aiverify/uploads/data/*
rm -f aiverify/uploads/model/*
rm -f aiverify/test-engine-app/logs/*

echo "aiverify developer reset completed"
