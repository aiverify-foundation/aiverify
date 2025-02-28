'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import FairnessTreeGroupList from '@/app/inputs/fairnesstree/components/GroupList';
import { FairnessTree } from '@/app/inputs/utils/types';

const queryClient = new QueryClient();

export default function FairnessTreeHydration({
  initialTrees,
}: {
  initialTrees: FairnessTree[];
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <FairnessTreeGroupList trees={initialTrees} />
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
