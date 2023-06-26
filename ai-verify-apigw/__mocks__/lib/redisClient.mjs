import {jest} from '@jest/globals'

const redisConnect = jest.fn().mockReturnValue({
  hGet: jest.fn(),
  hSet: jest.fn(),
  xAdd: jest.fn(),
  publish: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  pSubscribe: jest.fn(),
  hGetAll: jest.fn(),
  exists: jest.fn(),
});

export default redisConnect;