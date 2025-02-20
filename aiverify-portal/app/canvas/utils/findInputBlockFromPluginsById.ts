import { InputBlock, Plugin } from '@/app/types';

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
