import React from 'react';
import { getAllFairnessTrees } from '@/lib/fetchApis/getAllFairnessTrees';
import { FairnessTreeModalContent } from './components/ModalView';
import { StandaloneView } from './components/StandaloneView';

interface PageProps {
  searchParams: {
    gid?: string;
    cid?: string;
    projectId?: string;
    flow?: string;
  };
}

export default async function FairnessTreePage({ searchParams }: PageProps) {
  const gid =
    searchParams.gid ||
    'aiverify.stock.fairness_metrics_toolbox_for_classification';
  const cid = searchParams.cid || 'fairness_tree';
  const projectId = searchParams.projectId;
  const flow = searchParams.flow;

  // Only fetch trees if we're not in project flow
  const trees = !projectId ? await getAllFairnessTrees() : [];

  // If we're in project flow, render the modal version
  if (projectId && flow) {
    return (
      <FairnessTreeModalContent
        gid={gid}
        cid={cid}
        projectId={projectId}
        flow={flow}
      />
    );
  }

  // Otherwise, render the standalone version
  return <StandaloneView initialTrees={trees} />;
}

// Re-export the modal wrapper for use in other components
export { FairnessTreeModalWrapper } from './components/ModalView';
