'use client';
import React, { useMemo } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
// import { useChecklists } from '@/app/inputs/context/ChecklistsContext';
import {
  useInputBlockGroupData,
  GetInputBlockDataReturnType,
} from '@/app/inputs/context/InputBlockGroupDataContext';
// import { Checklist } from '@/app/inputs/utils/types';
import { useMDXSummaryBundle } from '../../[groupId]/hooks/useMDXSummaryBundle';
import {
  WarningCircleIcon,
  CheckCircleIcon,
} from '../../[groupId]/utils/icons';

// Separate component for individual checklist progress
const GroupProgressItem: React.FC<{
  group: GetInputBlockDataReturnType;
}> = ({ group }) => {
  // Always call hooks at the top level, before any conditional logic
  const { data: mdxSummaryBundle } = useMDXSummaryBundle(
    group.inputBlock?.gid || '',
    group.inputBlock?.cid || ''
  );

  // Call useMemo hook unconditionally before any conditional returns
  const progressData = useMemo(() => {
    if (!group.ibdata?.data || !group.inputBlock || !mdxSummaryBundle?.code) {
      return null;
    }

    try {
      const context = {
        React,
        jsx: ReactJSXRuntime.jsx,
        jsxs: ReactJSXRuntime.jsxs,
        _jsx_runtime: ReactJSXRuntime,
        Fragment: ReactJSXRuntime.Fragment,
      };

      const moduleFactory = new Function(
        ...Object.keys(context),
        `${mdxSummaryBundle.code}`
      );
      const moduleExports = moduleFactory(...Object.values(context));
      const progressFn = moduleExports.progress;

      return progressFn ? progressFn(group.ibdata.data) : null;
    } catch (error) {
      console.error('Error parsing MDX code:', error);
      return null;
    }
  }, [mdxSummaryBundle, group]);

  // Early return after all hooks have been called
  if (!group.ibdata.data || !group.inputBlock) {
    return null;
  }

  const isCompleted = progressData === 100;

  return (
    <div
      key={group.inputBlock.cid}
      className="flex cursor-pointer items-center justify-between rounded bg-secondary-950 p-1 hover:bg-secondary-900">
      <div className="flex items-center gap-1">
        <div className="w-6 shrink-0">
          {isCompleted ? (
            <CheckCircleIcon
              color="#3BB140"
              size={20}
            />
          ) : (
            <WarningCircleIcon
              color="#EE914E"
              size={20}
            />
          )}
        </div>
        <span className="text-sm font-medium text-white">
          {group.inputBlock.name}
        </span>
      </div>
    </div>
  );
};

const ProgressSidebar: React.FC = () => {
  const { group, inputBlocks, getInputBlockData } = useInputBlockGroupData();

  // Filter and create the list of input blocks data
  const filteredInputBlocks = inputBlocks
    ? inputBlocks.reduce((acc, ib) => {
        const group = getInputBlockData(ib.cid);
        if (group) acc.push(group);
        return acc;
      }, [] as GetInputBlockDataReturnType[])
    : [];

  return (
    <div className="mt-0 mt-6 h-full rounded border border-secondary-300 bg-secondary-950 p-4">
      <h3 className="mb-4 text-lg font-semibold">{group} Progress</h3>
      {filteredInputBlocks.map((ib) => (
        <GroupProgressItem
          key={ib.inputBlock.cid}
          group={ib}
        />
      ))}
    </div>
  );
};

export default ProgressSidebar;
