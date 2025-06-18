#!/bin/bash

set -e

# Ensure docker-compose file exists
COMPOSE_FILE="docker-compose.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Error: $COMPOSE_FILE not found in $(pwd)"
  exit 1
fi

echo "Starting Docker containers using $COMPOSE_FILE..."
docker compose -f "$COMPOSE_FILE" up -d

echo "Docker containers are running."
