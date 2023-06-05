# Installation Guide

## Software Requirements

### Operation System Supported
- Linux

### Prerequisites

- nodejs >= 16.x
- mongodb >= 5.0
- redis >= 5.0

## Installing NodeJS 16.x

### Using Ubuntu
```sh
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Using Debian, as root
```sh
curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
apt-get install -y nodejs
```
## Installing and Setting up mongodb

Install mongodb. See [MongoDB Installation Guides](https://www.mongodb.com/docs/manual/installation/)

Create a new user
```sh
use aiverify
db.createUser({user:"aiverify",pwd:"aiverify",roles:["readWrite"]})
```

## Install Redis

Install redis server. See [Redis Installation Guide](https://redis.io/docs/getting-started/installation/install-redis-on-linux/)

```sh
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install redis
```

Update /etc/redis/redis.conf and set notify-keyspace-events to Kh

```text
notify-keyspace-events Kh
```

## Customize the environment variable
To customize the default environment, you can create a **.env.local** file in the project root directory. This will override the **.env** defaults set.


# Running the Application

Make sure that mongodb and redis server are running before starting the application.

## Run NodeJS in development mode
```sh
npm run dev
```

## Run NodeJS in production mode
```sh
npm run start
```

## Run NodeJS unit tests
```sh
npm run test
```

## API UIs

- [A.I Verify Portal](http://localhost:3000/)
- [GraphQL](http://localhost:3000/api/graphql/)
