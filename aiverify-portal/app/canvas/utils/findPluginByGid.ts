import { Plugin } from '@/app/types';

/**
 * Finds a plugin from an array of plugins by matching gid
 * @param plugins Array of plugins to search through
 * @param gid Global identifier for the plugin
 * @returns The matching plugin object if found, undefined otherwise
 */
function findPluginByGid(plugins: Plugin[], gid: string): Plugin | undefined {
  return plugins.find((plugin) => plugin.gid === gid);
}

export { findPluginByGid };
