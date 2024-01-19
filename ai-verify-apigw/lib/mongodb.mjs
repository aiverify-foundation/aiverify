'use strict'

import mongoose from 'mongoose';

if (!process.env.DB_USERNAME || !process.env.DB_PASSWORD) {
  console.log('\x1b[31m\x1b[43m%s\x1b[0m', 'ai-verify-apigw - DB_USERNAME or DB_PASSWORD not found. Please add them to the .env file in the root of the ai-verify-apigw project.');
  process.exit(1);
}

if (!process.env.DB_HOST || !process.env.DB_PORT) {
  console.log('\x1b[31m\x1b[43m%s\x1b[0m', 'ai-verify-apigw - DB_HOST or DB_PORT not found. Please add them to the .env file in the root of ai-verify-apigw project.');
  process.exit(1);
}

const DB_URI = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/aiverify`;

console.debug(`Connecting to ${DB_URI}`);
mongoose.connect(DB_URI, {useNewUrlParser: true});
var db = mongoose.connection;

db.on('error', err => {
  if (err.message.includes('Authentication failed')) {
    console.log('\x1b[31m\x1b[43m%s\x1b[0m', 'ai-verify-apigw - Authentication failed while connecting to DB. Please ensure the username and password has been set up in the database. Check your username and password are correct.');
    console.log('\x1b[31m\x1b[43m%s\x1b[0m', 'ai-verify-apigw - If credentials are correct, please check that the database named "aiverify" has been set up in mongodb');
  } else {
    console.error('An error occured while connecting to DB: %s', err.message);
  }
});

db.once('open', () => {
  console.log("Database connected");
});

export default mongoose;