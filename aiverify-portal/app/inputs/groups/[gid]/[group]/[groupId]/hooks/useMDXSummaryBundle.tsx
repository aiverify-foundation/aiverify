import { useQuery } from '@tanstack/react-query';

interface MDXBundle {
  code: string;
  frontmatter: Record<string, unknown>;
}

export const useMDXSummaryBundle = (gid?: string, cid?: string) => {
  return useQuery<MDXBundle | null>({
    queryKey: ['mdxBundle', gid, cid],
    enabled: !!gid && !!cid,
    queryFn: async () => {
      try {
        const response = await fetch(`/api/plugins/${gid}/summary/${cid}`);
        
        // Handle 404 (Not Found) gracefully since MDX bundles are optional
        if (response.status === 404) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch MDX bundle: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        // Only re-throw if it's not a fetch error for missing resource
        if (error instanceof TypeError || (error instanceof Error && !error.message.includes('Failed to fetch MDX bundle'))) {
          console.error('Error fetching MDX bundle:', error);
          throw error;
        }
        throw error;
      }
    },
  });
};
