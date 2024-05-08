#!/bin/bash

##########  Start of variables to customize  ##########

# Replace the empty values of the following variables with the appropriate
# values for your environment.

# Namespace to deploy and run aiverify, default to aiverify
NAMESPACE=""

# StorageClass names for the EBS CSI add-on. This is used to create the
# PersistentVolumeClaims for persistent storage used by the aiverify-db component.
# Default to ebs-gp3.
EBS_STGCLASS_NAME=""

# StorageClass names for the EFS CSI add-on. This is used to create the
# PersistentVolumeClaim for shared filesystem used for interaction between the
# aiverify-portal and aiverify-test-engine components.
# Default to efs-fs.
EFS_STGCLASS_NAME=""

# Image URL for the aiverify-portal component
# e.g. 111122223333.dkr.ecr.ap-southeast-1.amazonaws.com/aiverify-portal:0.10
# No default value is provided for this variable.
PORTAL_IMG_URL=""

# Image URL for the aiverify-test-engine component
# e.g. 111122223333.dkr.ecr.ap-southeast-1.amazonaws.com/aiverify-test-engine:0.10
# No default value is provided for this variable.
TESTENGINE_IMG_URL=""

# Image URL for the aiverify-redis component
# Default to public.ecr.aws/docker/library/redis:6.2-alpine
REDIS_IMG_URL=""

# Image URL for the aiverify-db component
# Default to public.ecr.aws/docker/library/mongo:6.0.4
MONGODB_IMG_URL=""

# The URL to access the aiverify portal, e.g. aiverify.eks.acme.com
# This value is also used to set ALLOWED_ORIGINS in the aiverify-portal deployment.
# No default value is provided for this variable.
INGRESS_HOST=""

# Specific to AWS Load Balancer Controller add-on:
# Name of the IngressGroup resource to associate with the aiverify ingress.
# Default to na (i.e. AWS Load Balancer Controller is not used)
INGRESS_GRP_NAME=""

# Specific to AWS Load Balancer Controller add-on:
# To set the name of the ALB associated with the aiverify ingress.
# Default to na (i.e. AWS Load Balancer Controller is not used)
INGRESS_ALB_NAME=""

# Specific to External DNS add-on:
# The DNS name of the public ALB to associate with the aiverify ingress, to
# enable internet access to aiverify portal. If you are not using External DNS,
# you will need to create the necessary DNS records manually.
# Default to na (i.e. External DNS is not used)
EXT_DNS_PUB_ALB=""

##########  End of variables to customize  ##########


# Check if variables are empty and provide default values (if any)
: ${NAMESPACE:="aiverify"}
: ${EBS_STGCLASS_NAME:="ebs-gp3"}
: ${EFS_STGCLASS_NAME:="efs-fs"}
: ${REDIS_IMG_URL:="public.ecr.aws/docker/library/redis:6.2-alpine"}
: ${MONGODB_IMG_URL:="public.ecr.aws/docker/library/mongo:6.0.4"}
: ${INGRESS_GRP_NAME:="na"}
: ${INGRESS_ALB_NAME:="na"}
: ${EXT_DNS_PUB_ALB:="na"}

# Check if PORTAL_IMG_URL is empty and exit with an error if it is
if [ -z "$PORTAL_IMG_URL" ]; then
    echo "Error: PORTAL_IMG_URL is not set."
    exit 1
fi
if [ -z "$TESTENGINE_IMG_URL" ]; then
    echo "Error: TESTENGINE_IMG_URL is not set."
    exit 1
fi
if [ -z "$INGRESS_HOST" ]; then
    echo "Error: INGRESS_HOST is not set."
    exit 1
fi

echo "Customizing manifest files with the following values:"
echo "NAMESPACE: $NAMESPACE"
echo "EBS_STGCLASS_NAME: $EBS_STGCLASS_NAME"
echo "EFS_STGCLASS_NAME: $EFS_STGCLASS_NAME"
echo "PORTAL_IMG_URL: $PORTAL_IMG_URL"
echo "TESTENGINE_IMG_URL: $TESTENGINE_IMG_URL"
echo "REDIS_IMG_URL: $REDIS_IMG_URL"
echo "MONGODB_IMG_URL: $MONGODB_IMG_URL"
echo "INGRESS_HOST: $INGRESS_HOST"
echo "INGRESS_GRP_NAME: $INGRESS_GRP_NAME"
echo "INGRESS_ALB_NAME: $INGRESS_ALB_NAME"
echo "EXT_DNS_PUB_ALB: $EXT_DNS_PUB_ALB"

# List of template files to process
TMPL_FILES=("aiverify-db.yml" "aiverify-ingress.yml" "aiverify-portal.yml" \
            "aiverify-redis.yml" "aiverify-shared-pvc.yml" "aiverify-test-engine.yml" \
            "aiverify-namespace.yml" )

for file in "${TMPL_FILES[@]}"; do
    # Replace placeholders with variable values and output to a new .yml file
    sed -e "s|<NAMESPACE>|${NAMESPACE}|g" \
        -e "s|<EBS_STGCLASS_NAME>|${EBS_STGCLASS_NAME}|g" \
        -e "s|<EFS_STGCLASS_NAME>|${EFS_STGCLASS_NAME}|g" \
        -e "s|<PORTAL_IMG_URL>|${PORTAL_IMG_URL}|g" \
        -e "s|<TESTENGINE_IMG_URL>|${TESTENGINE_IMG_URL}|g" \
        -e "s|<REDIS_IMG_URL>|${REDIS_IMG_URL}|g" \
        -e "s|<MONGODB_IMG_URL>|${MONGODB_IMG_URL}|g" \
        -e "s|<INGRESS_HOST>|${INGRESS_HOST}|g" \
        -e "s|<INGRESS_GRP_NAME>|${INGRESS_GRP_NAME}|g" \
        -e "s|<INGRESS_ALB_NAME>|${INGRESS_ALB_NAME}|g" \
        -e "s|<EXT_DNS_PUB_ALB>|${EXT_DNS_PUB_ALB}|g" \
        "${file}.tmpl" > "${file}"
done
