'use client';
import React, { useMemo } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { useMDXSummaryBundle } from '@/app/inputs/checklists/[groupId]/hooks/useMDXSummaryBundle';
import {
  WarningCircleIcon,
  CheckCircleIcon,
} from '@/app/inputs/checklists/[groupId]/utils/icons';
import { useChecklists } from '@/app/inputs/context/ChecklistsContext';
import { Checklist } from '@/app/inputs/utils/types';

// Define the order of principles based on their groupNumber in meta.json
const PRINCIPLE_ORDER: { [key: string]: number } = {
  transparency_process_checklist: 1,
  explainability_process_checklist: 2,
  reproducibility_process_checklist: 3,
  safety_process_checklist: 4,
  security_process_checklist: 5,
  robustness_process_checklist: 6,
  fairness_process_checklist: 7,
  data_governance_process_checklist: 8,
  accountability_process_checklist: 9,
  human_agency_oversight_process_checklist: 10,
  inclusive_growth_process_checklist: 11,
  organisational_considerations_process_checklist: 12,
};

// Separate component for individual checklist progress
const ChecklistProgressItem: React.FC<{ checklist: Checklist }> = ({
  checklist,
}) => {
  const { data: mdxSummaryBundle } = useMDXSummaryBundle(
    checklist.gid,
    checklist.cid
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

      return progressFn ? progressFn(checklist.data) : null;
    } catch (error) {
      console.error('Error parsing MDX code:', error);
      return null;
    }
  }, [mdxSummaryBundle, checklist.data]);

  const isCompleted = progressData === 100;

  return (
    <div
      key={checklist.id}
      className="flex cursor-pointer items-center justify-between rounded bg-secondary-950 p-1 hover:bg-secondary-900">
      <div className="flex items-center gap-1">
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
        <span className="text-sm font-medium text-white">{checklist.name}</span>
      </div>
    </div>
  );
};

const ProgressBar: React.FC<{ groupName: string }> = ({ groupName }) => {
  const { checklists } = useChecklists();

  const groupChecklists = useMemo(() => {
    // Filter checklists by group name
    const filtered = checklists.filter(
      (checklist) => checklist.group.toLowerCase() === groupName.toLowerCase()
    );

    // Sort by the predefined order based on cid
    return filtered.sort((a, b) => {
      const aOrder = PRINCIPLE_ORDER[a.cid] || Infinity;
      const bOrder = PRINCIPLE_ORDER[b.cid] || Infinity;

      return aOrder - bOrder;
    });
  }, [checklists, groupName]);

  return (
    <div className="mt-6 rounded border border-secondary-300 bg-secondary-950 p-4">
      <h3 className="mb-4 text-lg font-semibold">
        Process Checklists Progress
      </h3>
      {groupChecklists.map((checklist) => (
        <ChecklistProgressItem
          key={checklist.id}
          checklist={checklist}
        />
      ))}
    </div>
  );
};

export default ProgressBar;
