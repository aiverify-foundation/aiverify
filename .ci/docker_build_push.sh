#!/bin/bash

# Check if the correct number of arguments is provided
if [ "$#" -lt 1 ] ; then
    echo "Usage: $0 <image-name> <tag> <github-username> <dockerfile-dir> [target tag-suffix]"
    exit 1
fi

# Abort script if any command fails
set -e

# Set variables
IMAGE_NAME=$1
TAG=$2
GITHUB_USERNAME=$3
DOCKERFILE_PATH=$4
TARGET=${5:-}
TAG_SUFFIX=${6:-}

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Remove Any Dangling Builder Instance
docker buildx rm --all-inactive --force

# echo "Create a new build instance..."

# Create a new builder instance
docker buildx create --name imagebuilder --use

# Inspect the builder instance
docker buildx inspect --bootstrap

echo "Build and push image name=$IMAGE_NAME tag=$TAG target=$TARGET tag_suffix=$TAG_SUFFIX..."

# Build and push the image for both amd64 and arm64 platforms
if [ -n "$TARGET" ]; then
    docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:$TAG-$TAG_SUFFIX -f $DOCKERFILE_PATH --provenance=false --sbom=false --target $TARGET --push .
else
    docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:$TAG -f $DOCKERFILE_PATH --provenance=false --sbom=false --push .
fi

echo "Create and push manifests..."

# Create and push the manifest for specified tag and the latest tag
if [ -n "$TARGET" ]; then
    docker buildx imagetools create -t ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:$TAG-$TAG_SUFFIX ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:$TAG-$TAG_SUFFIX
    docker buildx imagetools create -t ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:latest-$TAG_SUFFIX ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:$TAG-$TAG_SUFFIX
else
    docker buildx imagetools create -t ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:$TAG ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:$TAG
    docker buildx imagetools create -t ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:latest ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:$TAG
fi

# Clean up build cache
yes | docker builder prune --all

# Clean up
docker buildx rm imagebuilder

echo "Docker image built and pushed to GitHub Container Registry successfully!"
