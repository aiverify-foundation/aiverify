!!! Info
      This method of installation are recommended for Advanced Users.
## Requirements

To run AI Verify, these are the minimum requirements to run AI Verify on a local computer.

### System

|                  | Minimum Requirements                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Operating System | Ubuntu 22.04                                                                                 |
| CPU\*            | At least 4 cores (Please note that this varies based on the complexity of the model tested.) |
| Memory           | At least 16GB                                                                                |
| Free Space       | At least 6GB of available space                                                              |
| GPU\*            | Depends on the model tested                                                                  |

### Software Requirements

| Software                                                                           | Minimum Version |
| ---------------------------------------------------------------------------------- | ------------------- |
| [NodeJs](https://nodejs.org/en/download)                                           | v18.x               |
| [Python](https://www.python.org/downloads/release/python-3100/)                    | v3.10               |
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

1. Create a folder where you intend to install AI Verify.
```bash
mkdir aiverify-env
```
2. Install the `setup-aiverify-dev.sh` file from our GitHub release page and copy the file into the folder created above.
3. Open a Terminal in the directory
4. Execute the script by executing the following code.
   ```bash
   cd aiverify-env #navigate to the folder created
   bash setup-aiverify-dev.sh
   ```
5. Wait for the set up to finish, do observe the logs for errors.

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
├── aiverify-env/
    ├── server-6.0.asc/
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
cd aiverify-env/aiverify
source venv/bin/activate
cd test-engine-app
python3 -m test_engine_app
```

### ai-verify-apigw

```bash
# Open a new terminal window #
cd aiverify-env/aiverify/ai-verify-apigw
node app.mjs
```

### ai-verify-portal

```bash
# Open a new terminal window #
cd aiverify-env/aiverify/ai-verify-portal
npm run start
```

## Running AI Verify

1. Once all the services are up and running, open your browser and type [localhost:3000](http://localhost:3000) in the address bar. You should see the AI Verify home page appears and will be able to access its functions.
   ![aiverify-home](../../res/getting-started/ai-verify-example.png)
