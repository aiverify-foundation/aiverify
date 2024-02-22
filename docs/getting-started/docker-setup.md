## System Recommended Requirements

To run AI Verify, these are the recommended requirements to run AI Verify on a local computer.

|                  | Recommended Requirements                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Operating System | Ubuntu 22.04 (64-bit)                                                                                 |
| Disk Space           | At least 10GB (excluding Docker Desktop)                                                                                |
| Memory           | At least 4GB                                                                                |

** For running the API Connector feature on Docker, we recommend using Ubuntu Virtual Machine.

### Software Required
- [Docker Desktop](https://docs.docker.com/get-docker/)  

## Download and Run AI Verify

!!! Note
    If you have installed AI Verify before, it is recommended to start the container in a clean state. Run the following commands to clean up existing data and files: 
      ```bash
      bash docker-start.sh --reset
      ```

1. Launch Docker Desktop.

2. Download `setup-aiverify.zip` from [Github Release](https://github.com/IMDA-BTG/aiverify/releases)

3. Unzip `setup-aiverify.zip`.

4. The folder structure should look like this.
```
<working directory>/
├── setup-aiverify/
    ├── aiverify-dev
    └── aiverify-user
        ├── DockerFile
        ├── docker-compose.yml
        ├── docker-build.sh
        ├── docker-start.sh
        ├── docker-stop.sh
        └── ...
```

5. Open a terminal and change the directory to the folder location.
```bash
cd aiverify-user
```

6. Execute the following command to build AI Verify.
```bash
bash docker-build.sh
```
By default, ai-verify-portal listens on port 3000. If you have changed the port or if you set up a different hostname other than 'localhost' for the app, update the value of `ALLOWED_ORIGINS` by adding the build arguments behind the `docker-build.sh`. The command below is an example of how to do it:
```bash
bash docker-build.sh --build-arg=ALLOWED_ORIGINS="http://localhost:3000,http://localhost:4000,http://<hostname>:<port>"
```
Replace `<hostname>` with your actual hostname and `<port>` with your actual port number. Ensure no spaces between commas.

7. Wait for the setup to finish. Do observe the logs for errors.

8. Click on the "Images" tab in Docker Desktop, you should see `ai-verify` image in the list of Docker Images: 
![docker-image](../../res/getting-started/docker-image-example.png)

!!! Warning
    It will take a while to build the docker image as there are many dependencies and modules required for the environment.   

## Run AI Verify

1. Start AI Verify using our start script. There might be a possibility that you might encounter this error if you are running this for the first time. If you do, execute the command again.
`Error response from daemon: failed to mkdir /var/lib/docker/volumes/aiverify-user_plugins-volume/_data/accumulated-local-effect/widgets: mkdir /var/lib/docker/volumes/aiverify-user_plugins-volume/_data/accumulated-local-effect/widgets: file exists`
```bash
bash docker-start.sh
```

2. Type [http://localhost:3000](http://localhost:3000) into your browser's address bar. 
!!! Warning
      Upon initial start-up of the toolkit, pages might take sometime to load.

   ![aiverify-home](../../res/getting-started/ai-verify-example.png)
