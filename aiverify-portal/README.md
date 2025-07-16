# AI Verify Portal (Web UI)

## Overview

The AI Verify Portal is the frontend UI for the AI Verify system. It serves as the primary interface for users to interact with the platform. The portal communicates with the AI Verify API Gateway (apigw) to retrieve and update data, ensuring seamless integration and data flow between the user interface and backend services. This setup allows users to efficiently manage and interact with their projects and data.

## System Requirements

Before installing and running the AI Verify Portal, ensure your system meets the following requirements:

- **Node.js**: Version 18 or higher
- **Operating System**: Compatible with systems that support Node.js
- **Third Library Dependencies**: Listed in the `package.json` file

Ensure you have Node.js 18.x or higher installed on your system. You can check your Node.js version by running: `node --version`.

## How to install the Portal

### 1. Install and run the aiverify-apigw

See the apigw [README.md](../aiverify-apigw/README.md) for installation and setup instructions. The apigw must be running when running the portal.

### 2. Build the `aiverify-shared-library`

```sh
cd aiverify-shared-library
npm install
npm run build
```

### 3. Install the portal

To install the portal, run the following commands under the `aiverify-portal` project directory.

```sh
cd aiverify-apigw/aiverify-apigw-node
npm install
npm link ../../aiverify-shared-library
```

## Environment Variables Configuration

The AI Verify Portal requires certain environment variables to be configured for proper operation. These variables can be set directly in the environment or specified in a `.env` file located in the `aiverify-portal` directory.

Below is a table of the environment variables and their descriptions:

| Variable Name   | Description                                    |
| --------------- | ---------------------------------------------- |
| `APIGW_HOST`    | The host address of the AI Verify API Gateway. Set to `http://localhost:4000` if the apigw is running on localhost. |
| `PROXY_TIMEOUT` | Set the proxy timeout. Default to 600000ms     |

## Running the Portal

To run the portal in development mode, the following commands

```sh
npm run dev
```

The frontend application will be available at http://localhost:3000.

# Docker Setup

To build apigw docker image, go to the `aiverify` root folder and run docker build on the Dockerfile:

Development build:

```sh
cd ..
docker build -t aiverify-portal -f aiverify-portal/Dockerfile --target development --no-cache .
cd aiverify-portal
```

Production build:

```sh
cd ..
docker build -t aiverify-portal -f aiverify-portal/Dockerfile --target production --no-cache .
cd aiverify-portal
```

To run the portal, run the following command with substitutes for the environment values if necessary.

```sh
docker run -d --name=aiverify-portal -p 3000:3000/tcp aiverify-portal
```

## Troubleshooting

### Common Issues

1. **"Error: fetch failed on /home"**

   - Check if the backend apigw is running on port 4000
   - Verify your .env configuration

2. **"Module not found" errors**

   - Run `npm install` and `npm run build` in the affected directory
   - Check if `aiverify-shared-library` is properly linked
