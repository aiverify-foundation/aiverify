'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { QueryProvider } from '@/app/inputs/[gid]/[cid]/components/QueryProvider';
import { FairnessTreeProvider } from '@/app/inputs/[gid]/[cid]/context/FairnessTreeContext';
import { ChevronLeftIcon } from '@/app/inputs/utils/icons';
import { FairnessTree } from '@/app/inputs/utils/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import ActionButtons from './ActionButtons';
import FairnessTreeHydration from './FairnessTreeHydration';

interface StandaloneViewProps {
  initialTrees: FairnessTree[];
  title?: string;
  description?: string;
}

export function StandaloneView({
  initialTrees,
  title = 'Decision Trees',
  description = 'Manage and view Decision Trees',
}: StandaloneViewProps) {
  // Add state to track if we've validated the data
  const [validatedTrees, setValidatedTrees] = useState<FairnessTree[]>([]);
  const [hasError, setHasError] = useState(false);

  // Validate trees on component mount
  useEffect(() => {
    try {
      // Check if initialTrees is an array and has the expected structure
      if (!Array.isArray(initialTrees)) {
        console.error('initialTrees is not an array:', initialTrees);
        setHasError(true);
        setValidatedTrees([]);
        return;
      }

      // Filter out any items that don't have the required properties
      const valid = initialTrees.filter(
        (tree) =>
          tree &&
          typeof tree === 'object' &&
          'gid' in tree &&
          'cid' in tree &&
          'name' in tree
      );

      console.log(
        `Validated decision trees: ${valid.length} of ${initialTrees.length} valid`
      );
      setValidatedTrees(valid);
      setHasError(valid.length === 0 && initialTrees.length > 0);
    } catch (error) {
      console.error('Error validating decision trees:', error);
      setHasError(true);
      setValidatedTrees([]);
    }
  }, [initialTrees]);

  return (
    <QueryProvider>
      <FairnessTreeProvider>
        <div className="p-6">
          <div className="mb-1 flex items-center justify-between">
            {/* Left section: Icon + Text */}
            <div className="flex items-center">
              <Icon
                name={IconName.File}
                size={40}
                color="#FFFFFF"
              />
              <div className="ml-3">
                <div className="flex">
                  <Link href="/inputs/">
                    <h1 className="text-2xl font-bold text-white hover:underline">
                      User Inputs
                    </h1>
                  </Link>
                  <ChevronLeftIcon
                    size={28}
                    color="#FFFFFF"
                  />
                  <h1 className="text-2xl font-bold text-white">{title}</h1>
                </div>
                <h3 className="text-white">{description}</h3>
              </div>
            </div>
            <ActionButtons />
          </div>

          {hasError && (
            <div
              className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
              role="alert">
              <p className="font-bold">Error loading decision trees</p>
              <p>
                There was a problem loading the decision tree data. Please try
                again or contact support.
              </p>
            </div>
          )}

          <FairnessTreeHydration initialTrees={validatedTrees} />
        </div>
      </FairnessTreeProvider>
    </QueryProvider>
  );
}
