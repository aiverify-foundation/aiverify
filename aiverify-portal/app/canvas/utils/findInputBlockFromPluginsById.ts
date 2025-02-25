import { InputBlock, Plugin } from '@/app/types';

/**
 * Finds an input block from a plugin by its CID and GID
 * @param plugins - The list of plugins to search through
 * @param pluginGid - The GID of the plugin to search in
 * @param inputBlockCid - The CID of the input block to find
 * @returns The input block if found, otherwise undefined
 */
export function findInputBlockFromPluginsById(
  plugins: Plugin[],
  pluginGid: string,
  inputBlockCid: string
): InputBlock | undefined {
  const plugin = plugins.find((plugin) => plugin.gid === pluginGid);
  if (!plugin) return undefined;
  const inputBlock = plugin.input_blocks.find(
    (ib) => ib.cid === inputBlockCid && ib.gid === pluginGid
  );
  if (!inputBlock) return undefined;
  return inputBlock;
}
