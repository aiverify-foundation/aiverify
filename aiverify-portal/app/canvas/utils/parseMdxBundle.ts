import { run } from '@mdx-js/mdx';
import { ReactElement } from 'react';
import * as runtime from 'react/jsx-runtime';
import { MdxBundle } from '@/app/types';

interface MDXContent {
  default: (props: { components?: Record<string, unknown> }) => ReactElement;
}

async function parseMDXBundle(bundle: MdxBundle): Promise<ReactElement> {
  try {
    const { code } = bundle;

    // Evaluate MDX with proper runtime context
    const evaluated = (await run(code, {
      ...runtime,
    })) as MDXContent;

    // Return the rendered component with no custom components
    return evaluated.default({ components: {} });
  } catch (error) {
    console.error('Error parsing MDX bundle:', error);
    throw new Error('Failed to parse MDX content');
  }
}

export { parseMDXBundle };
