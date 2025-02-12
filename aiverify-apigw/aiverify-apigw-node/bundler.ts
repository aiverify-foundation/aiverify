import { bundleMDX } from "mdx-bundler";
import rehypeMdxImportMedia from "rehype-mdx-import-media";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Plugin } from 'unified'
import type { Node } from 'unist'
import type { Root } from 'mdast'
import path from "path";

interface MdxNode extends Node {
  children?: MdxChild[]
  data?: {
    hProperties?: Record<string, string>
  }
}

interface MdxChild extends Node {
  type: string
  value?: string
}

const remarkInjectDataKey: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node: MdxNode) => {
      // Specifically target heading nodes that contain MDX expressions
      if (node.type === 'heading' && node.children) {
        const mdxExpression = node.children.find((child: MdxChild) => 
          child.type === 'mdxTextExpression' && 
          child.value?.includes('props.properties')
        )

        if (mdxExpression) {
          // Extract property key from the MDX expression
          const propertyMatch = mdxExpression.value?.match(/props\.properties(?:\.|\.?\?)\.(\w+)/)
          if (propertyMatch) {
            node.data = node.data || {}
            node.data.hProperties = node.data.hProperties || {}
            node.data.hProperties['data-aivkey'] = propertyMatch[1]
          }
        }
      }
    })
  }
}


export async function bundleWidgetMDX(
  scriptPath: string
): Promise<ReturnType<typeof bundleMDX>> {
  const result = await bundleMDX({
    // cwd: pluginPath,
    file: scriptPath,
    // globals: {'MyCheckbox':'MyCheckbox'},
    // globals: {'ai-verify-shared-library/charts':'ai-verify-shared-library/charts'},
    mdxOptions: (options) => {
      options.remarkPlugins = [
        ...(options.remarkPlugins ?? []),
        remarkGfm,
        remarkInjectDataKey,
      ];
      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        rehypeMdxImportMedia,
      ];
      return options;
    },
    esbuildOptions: (options) => {
      options.loader = {
        ...options.loader,
        ".png": "dataurl",
      };
      options.nodePaths = [path.resolve(process.cwd(), "node_modules")];
      // options.external = ["aiverify-shared-library/*", "moment"];
      return options;
    },
  });
  // console.log("validateMDX result", result)
  return result;
}

export async function bundleSummaryMDX(
  scriptPath: string
): Promise<ReturnType<typeof bundleMDX>> {
  const result = await bundleMDX({
    file: scriptPath,
  });
  // console.log("validateMDX result", result)
  return result;
}
