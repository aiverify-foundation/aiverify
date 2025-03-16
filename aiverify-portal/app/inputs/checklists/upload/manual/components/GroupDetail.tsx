'use client';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { useMDXSummaryBundle } from '@/app/inputs/checklists/[groupId]/hooks/useMDXSummaryBundle';
import { useChecklists } from '@/app/inputs/checklists/upload/context/ChecklistsContext';
import { Checklist, InputBlock } from '@/app/inputs/utils/types';
import { Card } from '@/lib/components/card/card';

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

//todo: replace any type

interface ChecklistMDXProps {
  checklist: {
    gid: string;
    cid: string;
    data: Record<string, string>;
    name: string;
  };
}

const ChecklistMDX: React.FC<ChecklistMDXProps> = ({ checklist }) => {
  const {
    data: mdxSummaryBundle,
    isLoading,
    error,
  } = useMDXSummaryBundle(checklist.gid, checklist.cid);

  const MDXComponent = useMemo(() => {
    if (!mdxSummaryBundle?.code) return {};

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

      return {
        progress: moduleExports.progress,
        summary: moduleExports.summary,
      };
    } catch (error) {
      console.error('Error creating MDX component:', error);
      return {};
    }
  }, [mdxSummaryBundle]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 w-3/4 rounded bg-secondary-800" />
        <div className="mt-2 h-4 w-1/2 rounded bg-secondary-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Error loading checklist content
      </div>
    );
  }

  if (!MDXComponent) {
    return (
      <div className="text-sm text-secondary-500">No summary available</div>
    );
  }

  return (
    <div className="mdx-content space-y-2">
      {MDXComponent.summary && (
        <div className="text-sm text-secondary-400">
          {MDXComponent.summary(checklist.data)}
        </div>
      )}
      {MDXComponent.progress && (
        <div className="flex items-center gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary-800">
            <div
              className="h-full bg-primary-500 transition-all duration-300 ease-in-out"
              style={{
                width: `${MDXComponent.progress(checklist.data)}%`,
              }}
            />
          </div>
          <span className="min-w-[3rem] text-sm text-secondary-400">
            {MDXComponent.progress(checklist.data)}%
          </span>
        </div>
      )}
    </div>
  );
};

const GroupDetail: React.FC = () => {
  const { checklists } = useChecklists();
  const router = useRouter();

  // Sort checklists by the predefined order based on cid
  const sortedChecklists = useMemo(() => {
    return [...checklists].sort((a, b) => {
      const aOrder = PRINCIPLE_ORDER[a.cid] || Infinity;
      const bOrder = PRINCIPLE_ORDER[b.cid] || Infinity;

      return aOrder - bOrder;
    });
  }, [checklists]);

  const handleChecklistClick = (checklist: Checklist) => {
    const searchParams = new URLSearchParams(window.location.search);
    const flow = searchParams.get('flow');
    const projectId = searchParams.get('projectId');

    let checklistUrl = `/inputs/checklists/upload/manual/${checklist.cid}`;
    if (flow && projectId) {
      checklistUrl += `?flow=${flow}&projectId=${projectId}`;
    }

    router.push(checklistUrl);
  };

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto bg-secondary-950 p-4 scrollbar-hidden">
      {sortedChecklists.map((checklist) => (
        <Card
          key={checklist.cid}
          size="md"
          className="group relative mb-4 w-full transform cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
          style={{
            border: '1px solid var(--color-secondary-300)',
            borderRadius: '0.5rem',
            padding: '1rem',
            width: '100%',
          }}
          cardColor="var(--color-secondary-950)"
          enableTiltEffect={false}
          onClick={() =>
            handleChecklistClick(checklist as unknown as InputBlock)
          }>
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium transition-colors duration-200 group-hover:text-primary-400">
                {checklist.name}
              </h3>
              {checklist.updated_at && (
                <span className="text-xs text-secondary-500">
                  Updated: {new Date(checklist.updated_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <ChecklistMDX checklist={checklist} />
          </div>
        </Card>
      ))}
    </div>
  );
};
export default GroupDetail;
