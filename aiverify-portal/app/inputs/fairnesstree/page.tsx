import React from 'react';
import { getAllFairnessTrees } from '@/lib/fetchApis/getAllFairnessTrees';
import { FairnessTreeModalContent } from './components/ModalView';
import { StandaloneView } from './components/StandaloneView';

interface PageProps {
  searchParams: Promise<{
    gid?: string;
    cid?: string;
    projectId?: string;
    flow?: string;
  }>;
}

export default async function FairnessTreePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const gid =
    params.gid || 'aiverify.stock.fairness_metrics_toolbox_for_classification';
  const cid = params.cid || 'fairness_tree';
  const projectId = params.projectId;
  const flow = params.flow;

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
