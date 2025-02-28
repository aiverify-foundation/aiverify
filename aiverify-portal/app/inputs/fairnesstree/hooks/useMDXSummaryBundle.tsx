import { useQuery } from '@tanstack/react-query';

interface MDXBundle {
  code: string;
  frontmatter: Record<string, unknown>;
}

export const useMDXSummaryBundle = (gid?: string, cid?: string) => {
  return useQuery<MDXBundle>({
    queryKey: ['mdxSummary', gid, cid],
    enabled: !!gid && !!cid,
    queryFn: async () => {
      try {
        const response = await fetch(`/api/plugins/${gid}/summary/${cid}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch MDX bundle: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching MDX bundle:', error);
        throw error;
      }
    },
  });
};
