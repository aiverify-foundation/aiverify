import { useQuery } from '@tanstack/react-query';
import { MdxBundle } from '@/app/types';

/**
 * Fetches the MDX summary bundle which includes validation and summary functions
 * @param gid Plugin group ID
 * @param cid Component ID
 * @returns Query result with the MDX summary bundle
 */
export function useMDXSummaryBundle(gid: string, cid: string) {
  return useQuery<MdxBundle, Error>({
    queryKey: ['mdx-summary-bundle', gid, cid],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/plugins/${gid}/summary/${cid}`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch MDX summary bundle: ${response.statusText}`
          );
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching MDX summary bundle:', error);
        throw error;
      }
    },
    enabled: !!gid && !!cid,
  });
}
