import { MdxBundle } from '@/app/types';

function parseMDXBundle(bundle: MdxBundle) {
  const { code } = bundle;
  const Component = new Function(`${code}; return Component;`)();
  return Component;
}

export { parseMDXBundle };
