import redisConnect from './redisClient.mjs';

const client = redisConnect();

async function _getAlgorithmBase (gid, field) {
  const key = `algo:${gid}`;
  const data = await client.hGet(key, field);
  if (!data)
    return {};
  else
    return JSON.parse(data);
}

export async function getAlgorithm (gid) {
  return _getAlgorithmBase(gid, "data");
}

export async function getAlgorithmInputSchema (gid) {
  return _getAlgorithmBase(gid, "inputSchema");
}

export async function getAlgorithmOutputSchema (gid) {
  return _getAlgorithmBase(gid, "outputSchema");
}

export async function getAlgorithmOutputSchemaByKey (key) {
  const data = await client.hGet(key, "outputSchema");
  if (!data)
    return {};
  else
    return JSON.parse(data);
}
