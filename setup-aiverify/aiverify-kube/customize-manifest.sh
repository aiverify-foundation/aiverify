#!/bin/bash

NAMESPACE=aiverify
EBS_STGECLASS_NAME=ebs-gp3
EFS_STGCLASS_NAME=efs-fs
PORTAL_IMG_URL=052567997892.dkr.ecr.ap-southeast-1.amazonaws.com/aiverify-portal:0.10
TESTENGINE_IMG_URL=052567997892.dkr.ecr.ap-southeast-1.amazonaws.com/aiverify-test-engine:0.10
REDIS_IMG_URL=public.ecr.aws/docker/library/redis:6.2-alpine
MONGODB_IMG_URL=public.ecr.aws/docker/library/mongo:6.0.4

INGRESS_GRP_NAME=ingress-grp-1
INGRESS_ALB_NAME=alb-aiss-plfm-dev-eks-cluster
INGRESS_HOST=aiverify.eks-dev.aipo-imda.net
EXT_DNS_PUB_ALB=alb-aiss-plfm-dev-wb-alb-1159675129.ap-southeast-1.elb.amazonaws.com
