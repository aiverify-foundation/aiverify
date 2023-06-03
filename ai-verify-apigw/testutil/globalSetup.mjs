import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  // it's needed in global space, because we don't want to create a new instance every test-suite
  const instance = await MongoMemoryServer.create();
  const uri = instance.getUri();
  global.__MONGOINSTANCE = instance;
  process.env.DB_URI = uri.slice(0, uri.lastIndexOf('/'));
  // console.log("globalSetup DB_URI", process.env.DB_URI)
};