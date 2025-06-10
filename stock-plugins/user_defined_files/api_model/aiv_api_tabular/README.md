# Build

Change the port as required

```bash
docker build --build-arg APP_PORT=5000 -t donation-predictor .
```

# Run

## Docker

```bash
docker run -d -p 5000:5000 --name donation-predictor donation-predictor
```

## Kubernetes

Change the namespace and ports to suit your requirements

```bash
kubectl apply -f kube.yaml
```