# AI Verify Kubernetes Deployment Guide

This guide provides step-by-step instructions on how to deploy AI Verify on a Kubernetes cluster using YAML files.

The provided YAML files are for reference and may need to be adapted to your specific environment. Consider the following:

- **Resource Limits**: Adjust CPU and memory requests/limits based on your cluster's capacity.
- **Storage**: Configure persistent storage if required.
- **Networking**: Modify service types (e.g., `ClusterIP`, `NodePort`, `LoadBalancer`) based on your networking setup.
- **Security**: Implement security best practices, such as using secrets for sensitive data and enabling network policies.

## Difference between this deployment and the deployment in `deployment/kubernetes` folder

The `deployment/kubernetes` folder deploys AI Verify on a Kubernetes cluster, with the tasks picked up by the Test Engine Worker being executed using Python Virtual Environment. In this `deployment/kubernetes-dev` folder, tasks are executed using kubectl. 

### 1. kubectl.yaml — Synchronous Execution via Pod (PIPELINE_EXECUTE="kubectl_run")

- The Test Engine Worker launches a Kubernetes pod for each task.
- It waits for the pod to complete execution.
- After execution:
   - The pod is deleted.
   - The TEW uploads the results to the API Gateway (APIGW).

Use this mode when:
- You prefer stricter task-by-task control.
- Each task must finish before the next one begins (sequential execution).
- TEW manages result uploading centrally.

### 2. kubectl2.yaml — Asynchronous Execution via Job (PIPELINE_EXECUTE="kubectl_run2")

- The TEW applies a Kubernetes Job for each task.
- It does not wait for job completion.
- Each pod inside the Job is responsible for uploading its own results to the APIGW.
- TEW continues to the next task immediately.
- TEW does not handle the uploading of results (PIPELINE_UPLOAD="kube_upload")

Use this mode when:

- You want to spin up many jobs in parallel across a cluster (one TEW instance can spin up many jobs).
- You do not wish to pre-provision test engine workers for peak load.
- Suitable for scaling and concurrency.

## Prerequisites

Before proceeding, ensure you have the following:

1. **Kubernetes Cluster**: A running Kubernetes cluster (e.g., Minikube, GKE, EKS, AKS, or any other Kubernetes provider).
2. **kubectl**: The Kubernetes command-line tool installed and configured to communicate with your cluster.

## Step 1: Create the `aiverify` Namespace

AI Verify should run in its own namespace for better isolation and management. To create the `aiverify` namespace, run the following command:

```bash
kubectl create namespace aiverify
```

## Step 2: Deploy AI Verify Using YAML Files

1. **Build portal image with your ARGs** 

From the root aiverify/ directory, use the following command, replacing the build arguments with your custom values:

```sh
DOCKER_BUILDKIT=1 docker build -f aiverify-portal/Dockerfile --build-arg APIGW_HOST="YOUR_APIGW_HOST" --build-arg NEXT_PUBLIC_APIGW_HOST="YOUR_NEXT_PUBLIC_APIGW_HOST" -t aiverify-portal --target production .
```

2. **Build test engine worker image with docker and kubectl support**

From the root aiverify/ directory, use the following command:

```sh
DOCKER_BUILDKIT=1 docker build -f aiverify-test-engine-worker/Dockerfile -t aiverify-test-engine-worker-kube --target docker-kube .
```

3. **Apply the YAML Files**: Apply the YAML files to deploy AI Verify in the `aiverify` namespace.

From this directory,

   ```bash
   kubectl apply -f <yaml-file> -n aiverify
   ```

   Repeat this command for each YAML file (e.g., `apigw.yaml`, `portal.yaml`, etc.)

   ```bash
   kubectl apply -f apigw.yaml
   kubectl apply -f portal.yaml
   kubectl apply -f valkey.yaml
   kubectl apply -f test_engine_worker_kubectl.yaml # or kubectl apply -f test_engine_worker_kubectl2.yaml
   ```


## Step 3: Verify the Deployment

After deploying AI Verify, verify that all components are running correctly.

1. **Check Pods**: Ensure that all pods are in the `Running` state.

   ```bash
   kubectl get pods -n aiverify
   ```

2. **Check Services**: Verify that the services are correctly exposed.

   ```bash
   kubectl get svc -n aiverify
   ```

3. **Access AI Verify**: Depending on your setup, access AI Verify via the exposed service (e.g., using the service's external IP or port-forwarding).

   ```bash
   kubectl port-forward svc/portal -n aiverify 3000:3000 & \
   kubectl port-forward svc/apigw -n aiverify 4000:4000 &
   ```

   Then, open your browser and navigate to [`http://localhost:3000`](http://localhost:3000).


