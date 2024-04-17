import { MongoMemoryServer } from 'mongodb-memory-server';
import casual from 'casual';

export default async function globalSetup() {
  // it's needed in global space, because we don't want to create a new instance every test-suite
  const instance = await MongoMemoryServer.create({
    instance: {
      auth: true,
    },
    auth: {
      enable: true,
      extraUsers: [{
        createUser: "aiverify",
        pwd: casual.password,
        roles: [
          { role: 'readWrite', db: 'aiverify' },
        ],
        database: 'aiverify',
      }]
    }
  });
  const instanceInfo = instance.instanceInfo;
  // console.log("auth", instance.auth)
  const uri = instance.getUri();
  // console.log("uri", uri)
  global.__MONGOINSTANCE = instance;
  process.env.DB_USERNAME = instance.auth.extraUsers[0].createUser;
  process.env.DB_PASSWORD = instance.auth.extraUsers[0].pwd;
  process.env.DB_HOST = instanceInfo.ip;
  process.env.DB_PORT = instanceInfo.port;
  const DB_URI = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/aiverify`;
  process.env.DB_URI = DB_URI;
  // console.log("globalSetup DB_URI", process.env.DB_URI)
  // console.log("globalSetup DB_USERNAME", process.env.DB_USERNAME)
  // console.log("globalSetup DB_PASSWORD", process.env.DB_PASSWORD)
  // console.log("globalSetup DB_HOST", process.env.DB_HOST)
  // console.log("globalSetup DB_PORT", process.env.DB_PORT)
};