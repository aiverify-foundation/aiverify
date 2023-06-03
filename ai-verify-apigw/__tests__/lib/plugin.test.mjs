import {jest} from '@jest/globals';
import casual from '#testutil/mockData.mjs';

describe("Test module plugin.mjs", () => {
  let plugin;
  let redis;
  const mockalgo = casual.algorithm;
  const gid = "fakegid";

  beforeAll(async() => {
    // mocking
    jest.unstable_mockModule("#lib/redisClient.mjs", () => {
      return import("#mocks/lib/redisClient.mjs");
    });
    const redisConnect = await import('#lib/redisClient.mjs');
    redis = redisConnect.default();
    plugin = await import("#lib/plugin.mjs");
  })

  beforeEach(async () => {
    jest.clearAllMocks();
  })

  it("should return algorithm data", async() => {
    redis.hGet.mockResolvedValue(JSON.stringify(mockalgo.data));
    const data = await plugin.getAlgorithm(gid);
    expect(data).toEqual(mockalgo.data);
    const key = `algo:${gid}`
    expect(redis.hGet).toHaveBeenCalledWith(key, "data");
  })

  it("should return empty object with invalid key", async() => {
    redis.hGet.mockResolvedValue(null);
    const data = await plugin.getAlgorithm(gid);
    expect(data).toEqual({});
    const key = `algo:${gid}`
    expect(redis.hGet).toHaveBeenCalledWith(key, "data");
  })

  it("should return algorithm input schema", async() => {
    redis.hGet.mockResolvedValue(JSON.stringify(mockalgo.inputSchema));
    const data = await plugin.getAlgorithmInputSchema(gid);
    expect(data).toEqual(mockalgo.inputSchema);
    const key = `algo:${gid}`
    expect(redis.hGet).toHaveBeenCalledWith(key, "inputSchema");
  })

  it("should return algorithm output schema", async() => {
    redis.hGet.mockResolvedValue(JSON.stringify(mockalgo.outputSchema));
    const data = await plugin.getAlgorithmOutputSchema(gid);
    expect(data).toEqual(mockalgo.outputSchema);
    const key = `algo:${gid}`
    expect(redis.hGet).toHaveBeenCalledWith(key, "outputSchema");
  })

  it("should return algorithm output schema by key", async() => {
    redis.hGet.mockResolvedValue(JSON.stringify(mockalgo.outputSchema));
    const key = `algo:${gid}`
    const data = await plugin.getAlgorithmOutputSchemaByKey(key);
    expect(data).toEqual(mockalgo.outputSchema);
    expect(redis.hGet).toHaveBeenCalledWith(key, "outputSchema");
  })


})