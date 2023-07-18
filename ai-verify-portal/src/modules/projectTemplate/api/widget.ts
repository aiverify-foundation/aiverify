import { ErrorWithMessage, toErrorWithMessage } from 'src/lib/errorUtils';

export type MDXBundle = {
  code: string;
  frontmatter: object;
};

const apiPath = '/api/bundler/';

export async function getMdxWidgetBundle(
  gid: string
): Promise<MDXBundle | ErrorWithMessage> {
  try {
    const response = await fetch(apiPath + gid);
    const data = await response.json();
    return {
      code: data.code,
      frontmatter: data.frontmatter,
    };
  } catch (err) {
    return toErrorWithMessage(err);
  }
}
