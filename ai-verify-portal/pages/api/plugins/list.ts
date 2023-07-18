import type { NextApiRequest, NextApiResponse } from 'next';

import { getPlugins } from 'server/pluginManager';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const plugins = await getPlugins();
  res.status(200).json(plugins);
}
