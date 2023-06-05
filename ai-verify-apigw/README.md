# Installation Guide

## Software Requirements

### Operation System Supported
- Linux

### Prerequisites

- nodejs >= 16.x
- pino-petty
- mongodb
- redis >= 5.0

## Installing NodeJS 16.x

### Using Ubuntu
	curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
	sudo apt-get install -y nodejs

### Using Debian, as root
	curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
	apt-get install -y nodejs

## Installing pino-pretty

	npm install -g pino-pretty

## Installing and Setting up mongodb

	Install mongodb
	sudo apt-get install mongodb 
	
	Create a new user:
	use aitestkit
	db.createUser({user:"aitestkit",pwd:"aitestkit",roles:["readWrite"]})


## Install Redis

Install redis server

	sudo apt install redis-server

Update /etc/redis/redis.conf and set notify-keyspace-events to Kh

	notify-keyspace-events Kh

## Set the environment variable
	Create a .env file with the following values
	NODE_ENV, MONGODB_URI

## Start mongo daemon
	mongod

## Run NodeJS
	npm run dev

## API UIs

- [GraphQL Explorer](http://localhost:4000/graphql/)
- [Swagger](http://localhost:4000/swagger/)