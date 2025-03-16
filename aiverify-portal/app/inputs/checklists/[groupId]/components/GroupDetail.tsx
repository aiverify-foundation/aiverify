'use client';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { useMDXSummaryBundle } from '@/app/inputs/checklists/[groupId]/hooks/useMDXSummaryBundle';
import { useChecklists } from '@/app/inputs/context/ChecklistsContext';
import { Checklist } from '@/app/inputs/utils/types';
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

const ChecklistMDX: React.FC<{ checklist: Checklist }> = ({ checklist }) => {
  const {
    data: mdxSummaryBundle,
    isLoading,
    error,
  } = useMDXSummaryBundle(checklist.gid, checklist.cid);

  const MDXComponent = useMemo(() => {
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
      const progress = moduleExports.progress;
      const summary = moduleExports.summary;

      return { progress, summary };
    } catch (error) {
      console.error('Error creating MDX component:', error);
      return null;
    }
  }, [mdxSummaryBundle]);

  // Memoize the rendered content based on both MDXComponent and checklist data
  const renderedContent = useMemo(() => {
    if (!MDXComponent) return null;

    return (
      <div className="mdx-content">
        {MDXComponent.summary && (
          <div className="mt-4 text-sm text-gray-400">
            {MDXComponent.summary(checklist.data)}
          </div>
        )}
        {MDXComponent.progress && (
          <div className="mt-4 text-sm text-gray-400">
            {MDXComponent.progress(checklist.data)}%
          </div>
        )}
      </div>
    );
  }, [MDXComponent, checklist.data]);

  if (isLoading) {
    return <div className="text-sm text-gray-400">Loading...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-400">Error loading content</div>;
  }

  if (!MDXComponent) {
    return <div className="text-sm text-gray-400">No content available</div>;
  }

  return renderedContent;
};

const GroupDetail: React.FC<{
  groupChecklists: Checklist[];
  groupName: string;
}> = ({ groupChecklists, groupName }) => {
  const { setSelectedChecklist } = useChecklists();
  const router = useRouter();

  // Sort checklists by the predefined order based on cid
  const sortedChecklists = useMemo(() => {
    return [...groupChecklists].sort((a, b) => {
      const aOrder = PRINCIPLE_ORDER[a.cid] || Infinity;
      const bOrder = PRINCIPLE_ORDER[b.cid] || Infinity;

      return aOrder - bOrder;
    });
  }, [groupChecklists]);

  const handleChecklistClick = (checklistId: number) => {
    const selectedChecklist = groupChecklists.find(
      (checklist) => checklist.id === checklistId
    );
    if (selectedChecklist) {
      setSelectedChecklist(selectedChecklist);
      router.push(`/inputs/checklists/${groupName}/${checklistId}`);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto bg-secondary-950 p-1 scrollbar-hidden">
      {sortedChecklists.map((checklist) => (
        <Card
          key={checklist.id}
          size="md"
          className="mb-4 w-full cursor-pointer shadow-md transition-shadow duration-200 hover:shadow-lg"
          style={{
            border: '1px solid var(--color-secondary-300)',
            borderRadius: '0.5rem',
            padding: '1rem',
            width: '100%',
            height: 'auto',
          }}
          cardColor="var(--color-secondary-950)"
          enableTiltEffect={false}
          onClick={() => handleChecklistClick(checklist.id)}>
          <div className="flex flex-col gap-2">
            <div className="text-lg font-medium">{checklist.name}</div>
            <div className="text-sm text-gray-500">
              Last updated:{' '}
              {new Date(checklist.updated_at).toLocaleDateString()}
            </div>
            <ChecklistMDX checklist={checklist} />
          </div>
        </Card>
      ))}
    </div>
  );
};

export default GroupDetail;
