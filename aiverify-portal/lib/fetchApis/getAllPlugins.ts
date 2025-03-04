import { Plugin } from '@/app/plugins/utils/types';

// TODO: Remove this function and use the getPlugins function instead.
export async function getAllPlugins(): Promise<Plugin[]> {
  const res = await fetch(`http://127.0.0.1:4000/plugins/`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch test results');
  }

  return res.json();
}
