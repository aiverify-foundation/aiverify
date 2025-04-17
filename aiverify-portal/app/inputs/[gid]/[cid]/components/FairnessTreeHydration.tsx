'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import React from 'react';
import FairnessTreeGroupList from '@/app/inputs/[gid]/[cid]/components/GroupList';
import { FairnessTree } from '@/app/inputs/utils/types';

const queryClient = new QueryClient();

// This component is named FairnessTreeHydration for historical reasons
// but it can actually handle any type of decision tree, not just fairness trees
export default function FairnessTreeHydration({
  initialTrees,
}: {
  initialTrees: FairnessTree[];
}) {
  // Safety check - ensure initialTrees is always an array
  const safeTrees = Array.isArray(initialTrees) ? initialTrees : [];

  // Log any potential issues with the data
  if (!Array.isArray(initialTrees)) {
    console.error(
      'Decision tree hydration received non-array initialTrees:',
      typeof initialTrees
    );
  } else if (initialTrees.length === 0) {
    console.log('Decision tree hydration received empty initialTrees array');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <FairnessTreeGroupList trees={safeTrees} />
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
