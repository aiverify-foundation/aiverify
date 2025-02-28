'use client';
import React, { useMemo } from 'react';
import { useChecklists } from '@/app/inputs/checklists/upload/context/ChecklistsContext';
import {
  WarningCircleIcon,
  CheckCircleIcon,
} from '../../[groupId]/utils/icons';
import { useMDXSummaryBundle } from '../../[groupId]/hooks/useMDXSummaryBundle';
import * as ReactJSXRuntime from 'react/jsx-runtime';

const ProgressBar: React.FC = () => {
  const { checklists, groupName } = useChecklists();

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
      <h3 className="mb-4 text-lg font-semibold">
        Process Checklists Progress
      </h3>

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
        {checklists.map((checklist) => {
          const {
            data: mdxSummaryBundle,
            isLoading,
            error,
          } = useMDXSummaryBundle(checklist.gid, checklist.cid);

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
              return progressFn ? progressFn(checklist.data) : 0;
            } catch (error) {
              console.error('Error parsing MDX code:', error);
              return null;
            }
          }, [mdxSummaryBundle, checklist.data]);

          const isCompleted = progressData === 100;

          return (
            <div
              key={checklist.cid}
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
                    {checklist.name}
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
