import { useQuery } from '@tanstack/react-query';

interface MDXBundle {
  code: string;
  frontmatter: Record<string, unknown>;
}

export const useMDXBundle = (gid?: string, cid?: string) => {
  return useQuery<MDXBundle>({
    queryKey: ['mdxBundle', gid, cid],
    enabled: !!gid && !!cid,
    queryFn: async () => {
      const response = await fetch(`/api/plugins/${gid}/bundle/${cid}`);
      if (!response.ok) throw new Error('Failed to fetch MDX bundle');
      return response.json();
    },
  });
};
