import type { NextApiRequest, NextApiResponse } from 'next';
import { deletePlugin, isStockPlugin } from 'server/pluginManager';
import _ from 'lodash';

export default async function deletePluginAPI(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { gid } = req.query;

  console.log('deletePlugin', gid);

  if (!gid || _.isArray(gid)) {
    return res.status(400).end();
  }

  if (isStockPlugin(gid as string)) {
    return res.status(400).json({ error: 'Cannot delete stock plugin' });
  }

  if (req.method === 'DELETE') {
    try {
      await deletePlugin(gid as string, true);
      return res.status(200).end();
    } catch (e) {
      console.log('error', e);
      return res.status(400).json({ error: e });
    }
  } else {
    return res.status(405);
  }
}
