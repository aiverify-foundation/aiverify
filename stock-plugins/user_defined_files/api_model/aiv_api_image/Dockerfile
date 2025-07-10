FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Declare build argument with default value 8000
ARG APP_PORT=8000
ENV APP_PORT=${APP_PORT}

# Copy requirements 
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code and model file
COPY app.py .
COPY fashion_mnist_pytorch.pt fashionMNISTPytorch.py .

# Expose port
EXPOSE ${APP_PORT}

# Run the FastAPI app with uvicorn on 0.0.0.0 so it is accessible outside container
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${APP_PORT}"]