'use strict'

import mongoose from 'mongoose';

// Use bluebird
// import * as Promise from "bluebird";
// import {Promise} from "bluebird";
// mongoose.Promise = Promise;

const DB_URI = process.env.DB_URI || 'mongodb://aiverify:aiverify@localhost:27017/aiverify';

// logger.debug(`TEST ${process.env.DB_URI}`);
console.debug(`Connecting to ${DB_URI}`);

mongoose.connect(DB_URI, {useNewUrlParser: true});

var db = mongoose.connection;

db.on('error', err => {
  console.error('db connection error: %s', err);
});

db.once('open', () => {
  // we're connected!
  console.log("Database connected");
});

export default mongoose;