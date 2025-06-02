#!/bin/bash

# Check if the correct number of arguments is provided
if [ "$#" -lt 1 ] ; then
    echo "Usage: $0 <push-build-boolean> <image-name> <tag> <github-username> <dockerfile-dir> [target tag-suffix]"
    exit 1
fi

# Set variables
PUSH=$1
IMAGE_NAME=$2
TAG=$3
GITHUB_USERNAME=$4
DOCKERFILE_DIR=$5
TARGET=${6:-}
TAG_SUFFIX=${7:-}

# echo "Create a new build instance..."

# Create a new builder instance
docker buildx create --name mybuilder --use

# Inspect the builder instance
docker buildx inspect --bootstrap

if [[ "$PUSH" = "false" ]]; then
    # Build aiverify-python-base
    echo "Build AI Verify Python Base"
    docker buildx build --platform linux/amd64,linux/arm64 -t $IMAGE_NAME -f $DOCKERFILE_DIR/Dockerfile .
else
    # Login to GitHub Container Registry
    echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

    echo "Build and push image name=$IMAGE_NAME tag=$TAG target=$TARGET tag_suffix=$TAG_SUFFIX..."

    # Build and push the image for both amd64 and arm64 platforms
    if [ -n "$TARGET" ]; then
        docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:$TAG-$TAG_SUFFIX -f $DOCKERFILE_DIR/Dockerfile --provenance=false --sbom=false --target $TARGET --push .
    else
        docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME:$TAG -f $DOCKERFILE_DIR/Dockerfile --provenance=false --sbom=false --push .
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
fi

# Clean up build cache
yes | docker builder prune --all

# Clean up
docker buildx rm mybuilder

echo "Docker image built and pushed to GitHub Container Registry successfully!"
