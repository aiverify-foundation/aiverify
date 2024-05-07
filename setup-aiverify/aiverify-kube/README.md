## Deploying AI Verify to Kubernetes Cluster

This README provides a guide on how to deploy aiverify to a Kubernetes cluster.

### Overview
These are the components to be deployed to the Kubernetes cluster
- aiverify portal - the web frontend to create reports, upload data and model files.
- aiverify test-engine - the backend where the algos and tests are run against the model.
- redis caching system - provides the message queue for interaction between portal and test-engine.
- mongodb database - stores records of reports created, data and models uploaded.

### Pre-requisities
#### Mandatory
- A Kubernetes cluster. This guide is based on AWS EKS.
- Persistent storage for the mongodb database, this guide is based on AWS EBS CSI.
- Persistent storage for file sharing between portal and test-engine. This guide is based on AWS EFS CSI.
- CoreDNS for assigning predictable DNS names to the components deployed.
#### Optional
- External DNS add-on. We use External DNS to automatically create an A record linked to our public ALB
for the aiverify portal Ingress object, enabling the portal to be accessed from the Internet.
- AWS Load Balancer Controller add-on. We use the group ingress feature of this add-on to ensure only one
ALB is created for every Ingress object created in the cluster.

#### Build the images
1. Install Docker on your machine for building the images. For Windows and MacOS, you can install Docker Desktop.
For Linux, install docker.io, e.g. `sudo apt install docker.io` (add your userid to the docker group to avoid having
to use sudo when calling the docker commands).  


2. Run the following scripts provided in the docker folder to build the images. We use docker buildx so you
can choose to build images based on your runtime platform (amd64 for x64, arm64 for ARM and Apple Silicon), e.g.
  - `bash docker-build-amd64-portal.sh`   -- builds the portal image in x64
  - `bash docker-build-amd64-test-engine.sh`   -- builds the test-engine image in x64

3. Tag the images so you can push the images to your container registry,
- `docker tag aiverify-portal:0.10-amd64 <container-registry-url>/aiverify-portal:0.10`
- `docker tag aiverify-test-engine:0.10-amd64 <container-registry-url>/aiverify-test-engine:0.10`

4. Push the images to your container registry
- `docker push <container-registry-url>/aiverify-portal:0.10`
- `docker push <container-registry-url>/aiverify-test-engine:0.10`

Replace <container-registry-url> with the actual url of your container registry.

>As an example, the following steps let you push the images to AWS Elastic Container Registry (ECR).
> 
>The ECR url has the following convention: <aws-acct-id>.dkr.ecr.<aws-region>.amazonaws.com. Let assume your
AWS account id and AWS region are 111122223333 and ap-southeast-1, then your ECR url will look something like
this: 111122223333.dkr.ecr.ap-southeast-1.amazonaws.com
>
>1. Ensure your IAM user/role has the permissions to push images to ECR.
>
>2. Retrieve an authentication token and authenticate your Docker client to your ECR instance:
>
>`aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 111122223333.dkr.ecr.ap-southeast-1.amazonaws.com`
>
>3. If this is the first time pushing the images, you need to create a repository for it in your ECR instance:
>`aws ecr create-repository --repository-name aiverify-portal --region ap-southeast-1`
>`aws ecr create-repository --repository-name aiverify-test-engine --region ap-southeast-1`
>
>4. Tag your image so you can push the image to this repository:
>`docker tag aiverify-portal:0.10-amd64 111122223333.dkr.ecr.ap-southeast-1.amazonaws.com/aiverify-portal:0.10`
>`docker tag aiverify-test-engine:0.10-amd64 111122223333.dkr.ecr.ap-southeast-1.amazonaws.com/aiverify-test-engine:0.10`
>
>5. Run the following command to push this image to the repository:
>`docker push 111122223333.dkr.ecr.ap-southeast-1.amazonaws.com/aiverify-portal:0.10`
>`docker push 111122223333.dkr.ecr.ap-southeast-1.amazonaws.com/aiverify-test-engine:0.10`

### Deploy the components





