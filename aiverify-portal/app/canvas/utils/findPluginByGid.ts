import { Plugin } from '@/app/types';

function findPluginByGid(plugins: Plugin[], gid: string): Plugin | undefined {
  return plugins.find((plugin) => plugin.gid === gid);
}

export { findPluginByGid };
