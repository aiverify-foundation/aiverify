import { useQuery } from '@tanstack/react-query';
import { MdxBundle } from '@/app/types';

const getMDXBundle = async (gid: string, cid: string): Promise<MdxBundle> => {
  const response = await fetch(`/api/plugins/${gid}/bundle/${cid}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch MDX bundle: ${response.statusText}`);
  }
  return response.json();
};

export function useMDXBundle(gid: string, cid: string) {
  return useQuery<MdxBundle, Error>({
    queryKey: ['mdx-bundle', gid, cid],
    queryFn: () => getMDXBundle(gid, cid),
    enabled: !!gid && !!cid,
  });
}
