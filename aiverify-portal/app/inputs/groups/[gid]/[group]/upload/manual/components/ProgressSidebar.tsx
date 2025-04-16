/* eslint-disable react-hooks/rules-of-hooks */
'use client';
import React, { useMemo } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { InputBlockGroup } from '@/app/inputs/utils/types';
import { useMDXSummaryBundle } from '../../../[groupId]/hooks/useMDXSummaryBundle';
import {
  WarningCircleIcon,
  CheckCircleIcon,
} from '../../../[groupId]/utils/icons';
import { useChecklists } from '../../context/ChecklistsContext';

// Define the order of principles based on their groupNumber in meta.json
// const PRINCIPLE_ORDER: { [key: string]: number } = {
//   transparency_process_checklist: 1,
//   explainability_process_checklist: 2,
//   reproducibility_process_checklist: 3,
//   safety_process_checklist: 4,
//   security_process_checklist: 5,
//   robustness_process_checklist: 6,
//   fairness_process_checklist: 7,
//   data_governance_process_checklist: 8,
//   accountability_process_checklist: 9,
//   human_agency_oversight_process_checklist: 10,
//   inclusive_growth_process_checklist: 11,
//   organisational_considerations_process_checklist: 12,
// };

// need to check back on eslint for usemdxbundle and usememo in callback

export interface ProgressBarProps {
  group: InputBlockGroup;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  group,
}: ProgressBarProps) => {
  const { checklists } = useChecklists();

  // Sort checklists by the predefined order
  // const sortedChecklists = useMemo(() => {
  //   return [...checklists].sort((a, b) => {
  //     const aOrder = PRINCIPLE_ORDER[a.cid] || Infinity;
  //     const bOrder = PRINCIPLE_ORDER[b.cid] || Infinity;

  //     return aOrder - bOrder;
  //   });
  // }, [checklists]);
  const sortedInputBlocks = group.inputBlocks;

  const calculateOverallProgress = () => {
    let totalProgress = 0;
    let completedChecklists = 0;

    checklists.forEach((checklist) => {
      if (checklist.data && Object.keys(checklist.data).length > 0) {
        completedChecklists++;
      }
    });

    totalProgress = (completedChecklists / checklists.length) * 100;
    return Math.round(totalProgress);
  };

  return (
    <div className="mt-6 rounded border border-secondary-300 bg-secondary-950 p-4">
      <h3 className="mb-4 text-lg font-semibold">{group.groupName} Progress</h3>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-secondary-400">Overall Progress</span>
          <span className="text-sm text-secondary-400">
            {calculateOverallProgress()}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary-800">
          <div
            className="h-full bg-primary-500 transition-all duration-300 ease-in-out"
            style={{
              width: `${calculateOverallProgress()}%`,
            }}
          />
        </div>
      </div>

      {/* Individual Checklist Progress */}
      <div className="space-y-3">
        {sortedInputBlocks.map((ib) => {
          const { data: mdxSummaryBundle } = useMDXSummaryBundle(
            ib.gid,
            ib.cid
          );

          const progressData = useMemo(() => {
            if (!mdxSummaryBundle?.code) return null;
            try {
              const context = {
                React,
                jsx: ReactJSXRuntime.jsx,
                jsxs: ReactJSXRuntime.jsxs,
                Fragment: ReactJSXRuntime.Fragment,
                _jsx_runtime: ReactJSXRuntime,
              };
              const moduleFactory = new Function(
                ...Object.keys(context),
                mdxSummaryBundle.code
              );
              const moduleExports = moduleFactory(...Object.values(context));
              const progressFn = moduleExports.progress;
              return progressFn ? progressFn(group.data[ib.cid]) : 0;
            } catch (error) {
              console.error('Error parsing MDX code:', error);
              return null;
            }
          }, [mdxSummaryBundle, group.data]);

          const isCompleted = progressData === 100;

          return (
            <div
              key={ib.cid}
              className="flex flex-col space-y-1 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                  <span className="text-sm font-medium text-white">
                    {ib.name}
                  </span>
                </div>
                {/*}
                <span className="text-sm text-secondary-400">
                  {progressData || 0}%
                </span>
                */}
              </div>

              {/* Individual progress bar */}
              {/*
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary-800">
                <div
                  className="h-full bg-primary-500 transition-all duration-300 ease-in-out"
                  style={{
                    width: `${progressData || 0}%`,
                  }}
                />
              </div>
              */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
