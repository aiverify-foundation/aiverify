#!/bin/bash

##########################################################################
# Script: docker_build_push_ecr.sh
#
# Description:
#   This script builds a multi-architecture Docker image using Docker Buildx
#   and pushes it to AWS Elastic Container Registry (ECR).
#
#   It supports multi-stage builds, optional build targets, and tag suffixes.
#   After building, it creates and pushes image manifests to support
#   multi-platform images.
#
# Requirements:
#   - Docker with Buildx support
#   - AWS CLI configured with credentials and access to ECR
#
# Environment Variables:
#   - AWS_ACCOUNT_ID : Your AWS account ID
#   - AWS_REGION     : The region for the ECR registry
#
# Note:
#   If the script is run locally,
#   1. Assume an IAM role with the necessary permissions to push images to ECR.
#      You can use the `aws sts assume-role` command to get temporary credentials
#      and export them as environment variables.
#   2. Uncomment the `aws ecr get-login-password` line to log in to ECR.
#
# Usage:
#   bash .ci/docker_build_push.sh <image-name> <tag> <github-username> <dockerfile-dir> [build-target tag-suffix]
#
# Example:
#  bash .ci/docker_build_push.sh aiverify-apigw 2.0.1 aiverify-foundation aiverify-apigw
#  bash .ci/docker_build_push.sh aiverify-apigw 2.0.1 aiverify-foundation aiverify-portal
#  bash .ci/docker_build_push.sh aiverify-test-engine-worker 2.0.0 aiverify-foundation aiverify-test-engine-worker base base
#  bash .ci/docker_build_push.sh aiverify-test-engine-worker 2.0.0 aiverify-foundation aiverify-test-engine-worker venv-build venv
#  bash .ci/docker_build_push.sh aiverify-test-engine-worker 2.0.0 aiverify-foundation aiverify-test-engine-worker docker-build docker
##########################################################################

# Abort script if any command fails
set -e

# Check if the correct number of arguments is provided
if [ "$#" -lt 1 ] ; then
    echo "Usage: $0 <image-name> <tag> <github-username> <dockerfile-dir> [build-target tag-suffix]"
    exit 1
fi

# Set variables
IMAGE_NAME=$1
TAG=$2
GITHUB_USERNAME=$3
DOCKERFILE_PATH=$4
TARGET=${5:-}
TAG_SUFFIX=${6:-}

ECR_REPO=$IMAGE_NAME
ECR_IMAGE_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$GITHUB_USERNAME/$IMAGE_NAME

# Remove Any Dangling Builder Instance
docker buildx rm --all-inactive --force

# echo "Create a new build instance..."

# Create a new builder instance
docker buildx create --name imagebuilder_ecr --use

# Inspect the builder instance
docker buildx inspect --bootstrap

echo "Build and push image name=$IMAGE_NAME tag=$TAG target=$TARGET tag_suffix=$TAG_SUFFIX..."

# If this script is run locally, uncomment the following line to log in to ECR
# aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push the image for both amd64 and arm64 platforms
if [ -n "$TARGET" ]; then
    docker buildx build --platform linux/amd64,linux/arm64 -t $ECR_IMAGE_URI:$TAG-$TAG_SUFFIX -f $DOCKERFILE_PATH --provenance=false --sbom=false --target $TARGET --push .
else
    docker buildx build --platform linux/amd64,linux/arm64 -t $ECR_IMAGE_URI:$TAG -f $DOCKERFILE_PATH --provenance=false --sbom=false --push .
fi

echo "Create and push manifests..."

# Create and push the manifest for specified tag and the latest tag
if [ -n "$TARGET" ]; then
    docker buildx imagetools create -t $ECR_IMAGE_URI:$TAG-$TAG_SUFFIX $ECR_IMAGE_URI:$TAG-$TAG_SUFFIX
    docker buildx imagetools create -t $ECR_IMAGE_URI:latest-$TAG_SUFFIX $ECR_IMAGE_URI:$TAG-$TAG_SUFFIX
else
    docker buildx imagetools create -t $ECR_IMAGE_URI:$TAG $ECR_IMAGE_URI:$TAG
    docker buildx imagetools create -t $ECR_IMAGE_URI:latest $ECR_IMAGE_URI:$TAG
fi

# Clean up build cache
yes | docker builder prune --all

# Clean up
docker buildx rm imagebuilder_ecr

echo "Docker image built and pushed to AWS ECR successfully!"
