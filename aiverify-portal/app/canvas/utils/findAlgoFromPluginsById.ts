import { Algorithm, Plugin } from '@/app/types';

/**
 * Finds an algorithm from a list of plugins by matching gid and cid
 * @param plugins Array of plugins to search through
 * @param pluginGid Global identifier for the plugin
 * @param algoCid Component identifier for the specific algorithm
 * @returns The matching algorithm object if found, undefined otherwise
 */
export function findAlgoFromPluginsById(
  plugins: Plugin[],
  pluginGid: string,
  algoCid: string
): Algorithm | undefined {
  const plugin = plugins.find((plugin) => plugin.gid === pluginGid);
  if (!plugin) return undefined;
  const algo = plugin.algorithms.find(
    (algo) => algo.cid === algoCid && algo.gid === pluginGid
  );
  if (!algo) return undefined;
  return algo;
}
