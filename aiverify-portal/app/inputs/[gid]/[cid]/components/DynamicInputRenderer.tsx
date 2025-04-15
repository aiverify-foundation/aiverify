'use client';

import React from 'react';
import { FairnessTreeModalContent } from '@/app/inputs/[gid]/[cid]/components/ModalView';
import { StandaloneView } from '@/app/inputs/[gid]/[cid]/components/StandaloneView';
import { DynamicInputBlockList } from '@/app/inputs/components/DynamicInputBlockList';
import { FairnessTree } from '@/app/inputs/utils/types';
import { InputBlock, InputBlockData } from '@/app/types';

interface DynamicInputRendererProps {
  title: string;
  description: string;
  inputBlock: InputBlock;
  inputBlockData: unknown;
  searchParams?: {
    projectId?: string;
    flow?: string;
  };
}

// Helper function to normalize tree data regardless of plugin
function normalizeTreeData(
  data: unknown,
  gid: string,
  cid: string
): FairnessTree[] {
  if (!data) {
    console.log(`No data provided for tree input block ${gid}/${cid}`);
    return [];
  }

  if (!Array.isArray(data)) {
    console.log(
      `Expected array data for tree input block ${gid}/${cid}, got:`,
      typeof data
    );
    return [];
  }

  // Attempt to normalize the data
  try {
    return data.map((item) => {
      // Ensure we have at least an empty data structure if data is missing
      if (!item.data) {
        console.log(
          `Missing data property in tree item for input block ${gid}/${cid}`,
          item
        );
        item.data = {};
      }
      return item as FairnessTree;
    });
  } catch (error) {
    console.error(
      `Error normalizing tree data for input block ${gid}/${cid}:`,
      error
    );
    return [];
  }
}

export default function DynamicInputRenderer({
  title,
  description,
  inputBlock,
  inputBlockData,
  searchParams,
}: DynamicInputRendererProps) {
  const { gid, cid } = inputBlock;
  const projectId = searchParams?.projectId;
  const flow = searchParams?.flow;

  try {
    // Check if this is a fullScreen input block, which is a property commonly set for tree-based inputs
    if (inputBlock.fullScreen) {
      console.log(`Detected fullScreen input block: ${gid}/${cid}`);

      // Project flow renders the modal version
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

      // Otherwise, render the standalone version with normalized data
      const treeData = normalizeTreeData(inputBlockData, gid, cid);
      console.log(`Normalized tree data for input block: ${gid}/${cid}`, {
        treeCount: treeData.length,
        firstTreeId: treeData[0]?.id || 'none',
      });

      // Use standard component for all tree visualizations
      return <StandaloneView initialTrees={treeData} />;
    }

    // Fall back to the standard input block renderer for other types
    const standardInputData = Array.isArray(inputBlockData)
      ? (inputBlockData as InputBlockData[])
      : [];
    return (
      <DynamicInputBlockList
        title={title}
        description={description}
        inputBlock={inputBlock}
        inputBlockData={standardInputData}
      />
    );
  } catch (error) {
    console.error(`Error rendering input block ${gid}/${cid}:`, error);
    // Fallback to standard input renderer in case of error
    const standardInputData = Array.isArray(inputBlockData)
      ? (inputBlockData as InputBlockData[])
      : [];
    return (
      <>
        <div
          className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
          role="alert">
          <p className="font-bold">Error loading input block</p>
          <p>
            There was an error loading the component for input block {gid}/{cid}
            . Please contact support.
          </p>
        </div>
        <DynamicInputBlockList
          title={title}
          description={description}
          inputBlock={inputBlock}
          inputBlockData={standardInputData}
        />
      </>
    );
  }
}
