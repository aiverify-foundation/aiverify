#!/bin/bash

mongosh <<EOF
  admin = db.getSiblingDB('admin')

  admin.auth('$MONGO_INITDB_ROOT_USERNAME', '$MONGO_INITDB_ROOT_PASSWORD')

  aiverify = db.getSiblingDB('aiverify')

  aiverify.createUser({
    user: 'aiverify',
    pwd: '$MONGO_AIVERIFY_PASSWORD',
    roles: [{ role: 'readWrite', db: 'aiverify' }],
  });

  aiverify.createCollection('test-collection');

EOF
