'use client';
import React, { useMemo, useContext } from 'react';
import { useChecklists } from '@/app/inputs/context/ChecklistsContext';
import { WarningCircleIcon, CheckCircleIcon } from '../utils/icons';
import { useMDXSummaryBundle } from '../hooks/useMDXSummaryBundle';
import * as ReactJSXRuntime from 'react/jsx-runtime';

const ProgressBar: React.FC<{ groupName: string }> = ({ groupName }) => {
  const { checklists } = useChecklists();

  const groupChecklists = useMemo(
    () =>
      checklists.filter(
        (checklist) => checklist.group.toLowerCase() === groupName.toLowerCase()
      ),
    [checklists, groupName]
  );

  // Use a single call to useMDXSummaryBundle with the first checklist
  const firstChecklist = groupChecklists[0];
  const { data: firstMdxSummaryBundle } = useMDXSummaryBundle(
    firstChecklist?.gid || '',
    firstChecklist?.cid || ''
  );

  const checklistProgress = useMemo(() => {
    return groupChecklists.map((checklist) => {
      if (!firstMdxSummaryBundle?.code)
        return { checklist, progressData: null };

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
          `${firstMdxSummaryBundle.code}`
        );
        const moduleExports = moduleFactory(...Object.values(context));
        const progressFn = moduleExports.progress;
        return { checklist, progressData: progressFn(checklist.data) };
      } catch (error) {
        console.error('Error parsing MDX code:', error);
        return { checklist, progressData: null };
      }
    });
  }, [groupChecklists, firstMdxSummaryBundle]);

  return (
    <div className="mt-6 rounded border border-secondary-300 bg-secondary-950 p-4">
      <h3 className="mb-4 text-lg font-semibold">
        Process Checklists Progress
      </h3>
      {checklistProgress.map(({ checklist, progressData }) => {
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
              <span className="text-sm font-medium text-white">
                {checklist.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressBar;
