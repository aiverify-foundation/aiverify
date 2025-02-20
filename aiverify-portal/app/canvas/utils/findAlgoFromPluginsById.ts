import { Algorithm, Plugin } from '@/app/types';

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
