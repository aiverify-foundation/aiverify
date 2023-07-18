import { createClient } from 'redis';

const REDIS_URI = process.env.REDIS_URI;
if (!REDIS_URI) {
  throw new Error(
    'Please define the REDIS_URI environment variable inside .env.local'
  );
}

const redisConnect = () => {
  const redis = createClient({
    url: REDIS_URI,
  });
  redis.on('error', (err) => {
    console.error('redis connection error:', err);
  });
  redis.on('ready', () => {
    // console.info('Message queue is ready')
  });
  // if (NODE_ENV !== 'test')
  redis.connect();
  return redis;
};
// const redis = connect();

export default redisConnect;
