/**
 * Special redis client for Apollo PubSub.
 */
'use strict'

// import { PubSub } from 'graphql-subscriptions';
// const pubsub = new PubSub();
import { RedisPubSub } from 'graphql-redis-subscriptions';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || '6379';

const pubsub = new RedisPubSub({
  connection: {
    //url: REDIS_URI - url field doesn't work, switch to host and port
    host: redisHost,
    port: redisPort
  }
  // publisher: redis,
  // subscriber: redis,
});

export default pubsub;