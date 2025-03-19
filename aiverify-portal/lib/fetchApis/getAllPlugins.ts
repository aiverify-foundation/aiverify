import { Plugin } from '@/app/plugins/utils/types';

const endpointUrl = `${process.env.APIGW_HOST}/plugins`;

// TODO: Remove this function and use the getPlugins function instead.
export async function getAllPlugins(): Promise<Plugin[]> {
  const res = await fetch(`${endpointUrl}/`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch test results');
  }

  return res.json();
}
