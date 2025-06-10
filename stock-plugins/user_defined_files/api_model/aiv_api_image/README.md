# Build

Change the port as required

```bash
docker build --build-arg APP_PORT=5001 -t fashion-mnist .
```

# Run

## Docker

```bash
docker run -d -p 5001:5001 --name fashion-mnist-container fashion-mnist
```

## Kubernetes

Change the namespace and ports to suit your requirements

```bash
kubectl apply -f kube.yaml
```