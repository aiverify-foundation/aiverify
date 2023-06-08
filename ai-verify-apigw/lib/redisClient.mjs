import { createClient } from 'redis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || '6379';
const REDIS_URI = "redis://"+redisHost+":"+redisPort;

if (!REDIS_URI) {
  throw new Error(
    'Please define the REDIS_URI environment variable inside .env.local'
  )
}

const redisConnect = () => {
  const redis = createClient({
    url: REDIS_URI,
    socket: {
      // Abort connecting to redis after 3 retries.
      reconnectStrategy: (retries) => {
        if (retries > 2) {
          console.error("Too many connect retries on redis.");
          return new Error("Too many connect retries on redis.");
        }
        else {
          return retries;
        }
      },
    },
  });
  // redis.on('error', (err) => {
  //   console.error('redis connection error:', err);
  // });
  redis.on('ready', () => {
    // console.info('Message queue is ready')
  })
  // if (NODE_ENV !== 'test')
  redis.connect();
  return redis; 
}
// const redis = connect();

export default redisConnect