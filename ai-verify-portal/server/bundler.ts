import path from 'node:path';
import { bundleMDX } from 'mdx-bundler';
// import {getMDXComponent} from 'mdx-bundler/client';
import { getByGID } from './pluginManager';
import { pluginPath } from './lib/pluginService';
import { BaseMDXComponent, InputBlock } from 'src/types/plugin.interface';
import remarkMdxImages from 'remark-mdx-images';
import remarkGfm from 'remark-gfm';

export async function getMDXBundle(gid: string) {
  const widget = (await getByGID(gid)) as BaseMDXComponent | null;
  if (!widget) return;
  // console.log("getMDXBundle", pluginPath, widget.mdxPath)
  const result = await bundleMDX({
    cwd: pluginPath,
    file: path.join(pluginPath, widget.mdxPath),
    // globals: {'MyCheckbox':'MyCheckbox'},
    mdxOptions: (options) => {
      options.remarkPlugins = [
        ...(options.remarkPlugins ?? []),
        remarkMdxImages,
        remarkGfm,
      ];
      return options;
    },
    esbuildOptions: (options) => {
      options.loader = {
        ...options.loader,
        '.png': 'dataurl',
      };
      return options;
    },
  });
  // const {code, frontmatter} = result;
  return { ...result, widget };
}

export async function getSummaryBundle(gid: string) {
  const widget = (await getByGID(gid)) as InputBlock | null;
  if (!widget) return;
  if (!widget.summaryPath) return;
  // console.log("getMDXBundle", pluginPath, widget.mdxPath)
  const result = await bundleMDX({
    cwd: pluginPath,
    file: path.join(pluginPath, widget.summaryPath),
    // globals: {'MyCheckbox':'MyCheckbox'},
    // mdxOptions: options => {
    // 	options.remarkPlugins = [...(options.remarkPlugins ?? []), remarkMdxImages, remarkGfm]
    // 	return options
    // },
    // esbuildOptions: options => {
    // 	options.loader = {
    // 		...options.loader,
    // 		'.png': 'dataurl',
    // 	}
    // 	return options
    // },
  });
  // const {code, frontmatter} = result;
  return { ...result, widget };
}
