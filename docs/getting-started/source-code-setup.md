!!! Info
      This method of installation are recommended for Advanced Users.
## Requirements

These are the recommended requirements to run AI Verify. 

### System

|                  | Recommended Requirements                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Operating System | Ubuntu 22.04 (64-bit)                                                                                 |
| Disk Space           | At least 3GB                                                                                |
| Memory           | At least 4GB                                                                                |
| Free Space       | At least 3GB of available space                                                              |

!!! Warning
      We do not officially provide support for Windows. For Windows developers, AI Verify requires minimally Windows 10 **with WSL2**. Please note that we have not conducted tests on Windows 10. Please follow instructions to set up WSL2 [here](https://learn.microsoft.com/en-us/windows/wsl/install) if you still wish to proceed.


### Software Requirements

| Software                                                                           | Recommended Version |
| ---------------------------------------------------------------------------------- | ------------------- |
| [NodeJs](https://nodejs.org/en/download)                                           | v18.x               |
| [Python](https://www.python.org/downloads/)                    | v3.11               |
| [MongoDB\*](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/) | v6.x                |
<!-- | [Redis..](https://redis.io/docs/getting-started/installation/)                       | v6.x                |
| [GraphQL..](https://graphql.org/)                                                    | v16.x               |
| [Git..](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)               | v2.x                | -->

!!! Warning
    If you already have MongoDB, you are required to execute these steps.
    
      ```bash
      $ mongosh

      aiverify = db.getSiblingDB('aiverify')

      aiverify.createUser({
         user: 'aiverify',
         pwd: 'aiverify',
         roles: [{ role: 'readWrite', db: 'aiverify' }],
         });
      ```  

## Install AI Verify

1. Download `setup-aiverify.zip` from [Github Release](https://github.com/IMDA-BTG/aiverify/releases).

2. Unzip `setup-aiverify.zip`.

3. Your folder structure should look like this.
```
<working directory>/
├── setup-aiverify/
    ├── aiverify-user 
    └── aiverify-dev
        └── setup-aiverify-dev.sh
```
4. Open a Terminal in the directory
5. Execute the script by executing the following code.
   ```bash
   cd aiverify-dev #navigate to the folder created
   bash setup-aiverify-dev.sh
   ```
6. If MongoDB is not installed on your system, you will be prompted to enter a new `DB Admin User` and `DB Admin Password` for MongoDB. You will also be prompted to create `DB AIVerify Username` and `DB AIVerify Password`. Once done, skip step 7 and proceed with the rest of the installation.
7. If MongoDB is already installed on your system, you will be prompted with the following: `Mongodb detected, have you created the db and user required by aiverify?`. If yes, input `y` and proceed to input `DB AIVerify Username` and `DB AIVerify Password`. If no, input `n` and proceed to the `Warning` step above to create the AI Verify Username and AI Verify Password in MongoDB.
8. Wait for the setup to finish. Do observe the logs for errors.

## Start AI Verify

### Redis and MongoDB

Redis and MongoDB are installed as system services, and should already be running.
Execute the following code to check that the services are running.

```bash
sudo systemctl status redis
sudo systemctl status mongod
```

If they are not running, execute these code to run them:

```bash
sudo systemctl start redis
sudo systemctl start mongod
```

### AI Verify Modules

AI Verify modules are configured as system services. To ensure AI Verify modules are running, following the instruction below to run each of the required services.

Your folder structure should look like this.
```
<working directory>/
├── aiverify-dev/
    ├── setup-aiverify-dev.sh/
    ├── aiverify/
      ├── test-engine-app/
      ├── ai-verify-apigw/
      ├── ai-verify-portal/
      └── ...
```

### test-engine-app

```bash
# Open a new terminal window #
cd aiverify
source venv/bin/activate
cd test-engine-app
python3 -m test_engine_app
```

### ai-verify-apigw

```bash
# Open a new terminal window #
cd aiverify/ai-verify-apigw
node app.mjs
```

### ai-verify-portal

```bash
# Open a new terminal window #
cd aiverify/ai-verify-portal
npm run start
```

!!! Warning
      By default, ai-verify-portal listens on port 3000. If you have changed the port or if you set up a different hostname other than 'localhost' for the app, update the value of `ALLOWED_ORIGINS` in `aiverify/ai-verify-apigw/.env` and restart ai-verify-apigw. To add a hostname, add behind the existing hostname like this: `ALLOWED_ORIGINS:http://localhost:3000,http://localhost:4000,http(s):<your hostname>:<port>`. Replace `<hostname>` with your actual hostname and `<port>` with your actual port number. Ensure no spaces between commas. 
      
## Running AI Verify

!!! Warning
      Upon initial start-up of the toolkit, pages might take sometime to load.

1. Once all the services are up and running, open your browser and type [localhost:3000](http://localhost:3000) in the address bar. You should see the AI Verify home page appears and will be able to access its functions.
   ![aiverify-home](../../res/getting-started/ai-verify-example.png)
