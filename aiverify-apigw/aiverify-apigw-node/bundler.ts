import { bundleMDX } from "mdx-bundler";
import rehypeMdxImportMedia from "rehype-mdx-import-media";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Node } from "unist";
import type { Root } from "mdast";
import path from "path";
import fs from "fs";

const enableDebug = false;

interface MdxNode extends Node {
  children?: MdxChild[];
  data?: {
    hProperties?: Record<string, string>;
  };
}

interface MdxChild extends Node {
  type: string;
  value?: string;
}

/**
 * IMPORTANT: dataKeyName value is used to identify the data key in the properties object.
 * This key name must match the key name used in the mdx editing overlay in aiverify-portal
 * @see {@link /aiverify/aiverify-portal/app/canvas/components/hocAddTextEditFuncitonality.tsx} for the matching value.
 */
const dataKeyName = "data-aivkey";

const remarkInjectDataKey: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, (node: MdxNode) => {
      if (enableDebug) {
        fs.appendFileSync("/tmp/mdx-debug.log", "\n=== Node Processing ===\n");
        fs.appendFileSync("/tmp/mdx-debug.log", `Node type: ${node.type}\n`);
      }

      if (
        (node.type === "heading" ||
          node.type === "paragraph" ||
          node.type === "mdxJsxFlowElement") &&
        node.children
      ) {
        if (enableDebug) {
          fs.appendFileSync("/tmp/mdx-debug.log", "Found matching node type\n");
        }

        const mdxExpression = node.children.find((child: MdxChild) => {
          if (enableDebug) {
            fs.appendFileSync(
              "/tmp/mdx-debug.log",
              `Checking child: type=${child.type}, value=${child.value}\n`
            );
          }
          const matches =
            (child.type === "mdxTextExpression" ||
              child.type === "mdxFlowExpression" ||
              child.type === "mdxExpression") &&
            child.value?.includes("props.properties");
          if (enableDebug) {
            fs.appendFileSync(
              "/tmp/mdx-debug.log",
              `Matches criteria: ${matches}\n`
            );
          }
          return matches;
        });

        if (mdxExpression) {
          if (enableDebug) {
            fs.appendFileSync("/tmp/mdx-debug.log", "Found mdxExpression\n");
          }
          const propertyMatch = mdxExpression.value?.match(
            /props\.properties\??\.([\w]+)/
          );
          if (enableDebug) {
            fs.appendFileSync(
              "/tmp/mdx-debug.log",
              `Property match: ${JSON.stringify(propertyMatch)}\n`
            );
          }

          if (propertyMatch) {
            node.data = node.data || {};
            node.data.hProperties = node.data.hProperties || {};
            node.data.hProperties[dataKeyName] = propertyMatch[1];
            if (enableDebug) {
              fs.appendFileSync(
                "/tmp/mdx-debug.log",
                `Set data-aivkey to: ${propertyMatch[1]}\n` +
                  `Node data: ${JSON.stringify(node.data)}\n`
              );
            }
          }
        }
      }

      if (
        node.type === "mdxJsxFlowElement" &&
        node.name === "p" &&
        node.children
      ) {
        const mdxExpression = node.children.find(
          (child: MdxChild) =>
            child.type === "mdxFlowExpression" &&
            child.value?.includes("props.properties")
        );

        if (mdxExpression) {
          const propertyMatch = mdxExpression.value?.match(
            /props\.properties\??\.([\w]+)/
          );
          if (propertyMatch) {
            // Modify the JSX element directly
            node.attributes = node.attributes || [];
            node.attributes.push({
              type: "mdxJsxAttribute",
              name: dataKeyName,
              value: propertyMatch[1],
            });
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
    file: scriptPath,
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
      // options.minify = false; // enable for debugging
      return options;
    },
  });
  return result;
}

export async function bundleSummaryMDX(
  scriptPath: string
): Promise<ReturnType<typeof bundleMDX>> {
  const result = await bundleMDX({
    file: scriptPath,
  });
  return result;
}
