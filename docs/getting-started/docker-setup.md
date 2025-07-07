## System Recommended Requirements

To run AI Verify, these are the recommended requirements to run AI Verify on a local computer.

|                  | Recommended Requirements                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Operating System | Ubuntu 22.04 (64-bit)                                                                                 |
| Disk Space           | At least 10GB (excluding Docker Desktop)                                                                                |
| Memory           | At least 16GB                                                                                |

** For running the API Connector feature on Docker, we recommend using Ubuntu Virtual Machine.

### Software Required
- [Docker Desktop](https://docs.docker.com/get-docker/)  

## Download and Run AI Verify

1. Download `compose.yaml` file
   ```
   wget https://raw.githubusercontent.com/aiverify-foundation/aiverify/refs/heads/main/deployment/docker-compose/compose.yaml
   ```

2. [Optional] Change default port number

By default AIVerify runs in port number 3000. If you wish to override this, change port mapping in compose.yml to 3002:3000 before running 
```docker-compose –profile portal –profile automated-tests-venv up -d```
 
refer to [this documentation](https://docs.docker.com/get-started/docker-concepts/running-containers/publishing-ports/) for both docker run and docker-compose command.


`3. Install and start services

!!! Note
    There are two ways of execution, manual test execution and uploading results and other way is to use automated test execution via Portal

For manual test execution use

```docker-compose -profile portal up -d```

For automated test execution via portal, use

```docker-compose –profile portal –profile automated-tests-venv up -d```


`4. Type [http://localhost:3000](http://localhost:3000) into your browser's address bar. 
!!! Warning
      Upon initial start-up of the toolkit, pages might take some time to load.

   ![aiverify-home](../res/getting-started/aiverify-home.png)
