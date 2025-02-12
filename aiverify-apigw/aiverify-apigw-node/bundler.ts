import { bundleMDX } from "mdx-bundler";
import rehypeMdxImportMedia from "rehype-mdx-import-media";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Plugin } from 'unified'
import type { Node } from 'unist'
import type { Root } from 'mdast'
import path from "path";
import fs from 'fs';

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
      fs.appendFileSync('/tmp/mdx-debug.log', '\n=== Node Processing ===\n');
      fs.appendFileSync('/tmp/mdx-debug.log', `Node type: ${node.type}\n`);

      if ((node.type === 'heading' || 
           node.type === 'paragraph' || 
           node.type === 'mdxJsxFlowElement') && 
          node.children) {
        
        fs.appendFileSync('/tmp/mdx-debug.log', 'Found matching node type\n');
        
        const mdxExpression = node.children.find((child: MdxChild) => {
          fs.appendFileSync('/tmp/mdx-debug.log', 
            `Checking child: type=${child.type}, value=${child.value}\n`
          );
          const matches = (child.type === 'mdxTextExpression' || 
                         child.type === 'mdxFlowExpression' || 
                         child.type === 'mdxExpression') && 
                        child.value?.includes('props.properties');
          fs.appendFileSync('/tmp/mdx-debug.log', `Matches criteria: ${matches}\n`);
          return matches;
        });

        if (mdxExpression) {
          fs.appendFileSync('/tmp/mdx-debug.log', 'Found mdxExpression\n');
          const propertyMatch = mdxExpression.value?.match(/props\.properties\??\.([\w]+)/);
          fs.appendFileSync('/tmp/mdx-debug.log', 
            `Property match: ${JSON.stringify(propertyMatch)}\n`
          );
          
          if (propertyMatch) {
            node.data = node.data || {};
            node.data.hProperties = node.data.hProperties || {};
            node.data.hProperties['data-aivkey'] = propertyMatch[1];
            fs.appendFileSync('/tmp/mdx-debug.log', 
              `Set data-aivkey to: ${propertyMatch[1]}\n` +
              `Node data: ${JSON.stringify(node.data)}\n`
            );
          }
        }
      }

      if (node.type === 'mdxJsxFlowElement' && node.name === 'p' && node.children) {
        const mdxExpression = node.children.find((child: MdxChild) => 
          child.type === 'mdxFlowExpression' && 
          child.value?.includes('props.properties')
        )

        if (mdxExpression) {
          const propertyMatch = mdxExpression.value?.match(/props\.properties\??\.([\w]+)/)
          if (propertyMatch) {
            // Modify the JSX element directly
            node.attributes = node.attributes || []
            node.attributes.push({
              type: 'mdxJsxAttribute',
              name: 'data-aivkey',
              value: propertyMatch[1]
            })
          }
        }
      }
    });
  };
};


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

