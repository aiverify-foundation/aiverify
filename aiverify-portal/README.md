# AI Verify Portal (Web UI)

The AI Verify Portal is currently undergoing a comprehensive revamp as part of AI Verify 2.0. We are working on enhancing the user interface to improve your experience. Stay tuned for updates!

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- Python (v3.11 or higher)
- pip (latest version)
- hatch (Python package manager)
- Git

## Project Structure

The AI Verify system consists of three main components:

1. `aiverify-portal`: The frontend web application (Next.js)
2. `aiverify-apigw`: The backend API gateway (Python)
3. `aiverify-shared-library`: Shared utilities and types

## Installation Instructions

### 1. Setting up aiverify-shared-library

First, set up the shared library as it's a dependency for other components:

```bash
cd aiverify-shared-library
npm install
npm run build
```

### 2. Setting up aiverify-apigw (Backend)

Navigate to the API gateway directory and set up the Python environment:

```bash
cd aiverify-apigw

# Create and activate Python virtual environment using hatch
hatch shell

# Install dependencies (choose based on your CPU architecture)
# For ARM64 (M1/M2 Macs):
sh ./install-arm64.sh
# For AMD64 (Intel/AMD processors):
sh ./install-amd64.sh

# Link shared library
npm link aiverify-shared-library

# Start the backend server
python -m aiverify_apigw
```

The backend server will start on http://localhost:4000 by default.

### 3. Setting up aiverify-portal (Frontend)

In a new terminal, set up and start the frontend application:

```bash
cd aiverify-portal
npm install
npm run dev
```

The frontend application will be available at http://localhost:3000.

## Environment Configuration

### Backend (.env file in aiverify-apigw)

Create a `.env` file in the `aiverify-apigw` directory with the following configuration:

```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=aiverify
PORT=4000
```

### Frontend (.env file in aiverify-portal)

Create a `.env` file in the `aiverify-portal` directory:

```env
APIGW_HOST=http://localhost:4000
```

## Development Workflow

1. Always start the backend server first (`aiverify-apigw`) and ensure it is linked to `aiverify-shared-library`
2. Then start the frontend development server (`aiverify-portal`)

## Troubleshooting

### Common Issues

1. **"Error: fetch failed on /home"**

   - Check if the backend server is running on port 4000
   - Verify your .env configuration
   - Ensure MongoDB is running if required

2. **"Module not found" errors**

   - Run `npm install` in the affected directory
   - Check if `aiverify-shared-library` is properly linked
