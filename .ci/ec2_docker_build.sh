#!/bin/bash

set -e

# Variables
REPO_URL="https://github.com/aiverify-foundation/aiverify.git"
CLONE_DIR="aiverify"

# Clone the repository
# if [ -d "$CLONE_DIR" ]; then
#   echo "Directory '$CLONE_DIR' already exists. Removing it..."
#   rm -rf "$CLONE_DIR"
# fi

# echo "Cloning AIVerify repository..."
# git clone "$REPO_URL"
# cd "$CLONE_DIR"

# Build Docker images
services=("aiverify-portal" "aiverify-apigw" "aiverify-test-engine-worker")

for service in "${services[@]}"; do
  echo "Building Docker image for $service using buildx..."
  docker buildx build --load --no-cache -f "$service/Dockerfile" -t "$service:latest" .
  echo "Pruning buildx cache..."
  docker buildx prune --force
done

echo "Docker images built successfully."

# Remove old images (excluding the newly built ones)
for service in "${services[@]}"; do
  echo "Removing old images for $service..."
  image_ids=$(docker images "$service" --format "{{.ID}}" | tail -n +2)
  if [ -n "$image_ids" ]; then
    docker rmi -f $image_ids || true
  fi
done
