'use client';
import React, { useMemo } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
// import { useChecklists } from '@/app/inputs/context/ChecklistsContext';
import {
  useInputBlockGroupData,
  GetInputBlockDataReturnType,
} from '@/app/inputs/context/InputBlockGroupDataContext';
// import { Checklist } from '@/app/inputs/utils/types';
import { InputBlockGroupDataChild, InputBlock } from '@/app/types';
import { useMDXSummaryBundle } from '../../[groupId]/hooks/useMDXSummaryBundle';
import {
  WarningCircleIcon,
  CheckCircleIcon,
} from '../../[groupId]/utils/icons';

// Separate component for individual checklist progress
const GroupProgressItem: React.FC<{
  group: GetInputBlockDataReturnType;
}> = ({ group }) => {
  if (!group.ibdata.data || !group.inputBlock) {
    return null;
  }
  const { data: mdxSummaryBundle } = useMDXSummaryBundle(
    group.inputBlock.gid,
    group.inputBlock.cid
  );

  const progressData = useMemo(() => {
    if (!mdxSummaryBundle?.code) return null;

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

const ProgressBar: React.FC<{ groupName: string }> = ({ groupName }) => {
  // const { checklists } = useChecklists();
  const { gid, group, groupId, groupDataList, inputBlocks, getInputBlockData } =
    useInputBlockGroupData();

  // const groupData =
  //   groupId && groupDataList
  //     ? groupDataList.find((x) => x.id === groupId)
  //     : null;
  // const inputBlocks = groupData ? groupData.input_blocks : [];

  // const groupChecklists = useMemo(() => {
  //   // Filter checklists by group name
  //   const filtered = checklists.filter(
  //     (checklist) => checklist.group.toLowerCase() === groupName.toLowerCase()
  //   );

  //   // Sort by the predefined order based on cid
  //   return filtered.sort((a, b) => {
  //     const aOrder = PRINCIPLE_ORDER[a.cid] || Infinity;
  //     const bOrder = PRINCIPLE_ORDER[b.cid] || Infinity;

  //     return aOrder - bOrder;
  //   });
  // }, [, /* checklists */ groupName]);
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

export default ProgressBar;
