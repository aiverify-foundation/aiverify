# Installation using Kubernetes

Refer to [deployment guide](https://github.com/aiverify-foundation/aiverify/tree/v2.x/deployment/kubernetes) for detailed installation instructions.

**Note**: The provided YAML files are for reference and may need to be adapted to your specific environment. Consider the following:
* Resource Limits: Adjust CPU and memory requests/limits based on your cluster's capacity.
* Storage: Configure persistent storage if required.
* Networking: Modify service types (e.g., ClusterIP, NodePort, LoadBalancer) based on your networking setup.
* Security: Implement security best practices, such as using secrets for sensitive data and enabling network policies.

## Step 1: Create the aiverify Namespace
```sh
kubectl create namespace aiverify
```

## Step 2: Deploy AI Verify Using Kubernetes YAML Files

1. **Sparse checkout the K8s YAML files**: Sparse Checkout of Kubernetes Deployment Files

   To clone only the `deployment/kubernetes` folder from the `v2.x` branch of the repository, use the following commands:

   ```bash
   # Clone the repository with sparse checkout for the specific folder
   git clone --filter=blob:none --sparse -b v2.x https://github.com/aiverify-foundation/aiverify.git
   cd aiverify
   git sparse-checkout set deployment/kubernetes
   ```

2. **Apply the YAML Files**: Apply the YAML files to deploy AI Verify in the `aiverify` namespace.

   ```bash
   kubectl apply -f <yaml-file> -n aiverify
   ```

   Repeat this command for each YAML file (e.g., `apigw.yaml`, `portal.yaml`, etc.).

   ```bash
   kubectl apply -f apigw.yaml
   kubectl apply -f portal.yaml
   kubectl apply -f valkey.yaml
   kubectl apply -f test_engine_worker.yaml
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


![aivf2-0](../res/getting-started/aiverify-home.png)
