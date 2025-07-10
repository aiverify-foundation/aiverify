'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
// import { useChecklists } from '@/app/inputs/context/ChecklistsContext';
// import { Checklist } from '@/app/inputs/utils/types';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { InputBlockGroupData } from '@/app/types';
import { Card } from '@/lib/components/card/card';
import { useMDXSummaryBundle } from '../../[groupId]/hooks/useMDXSummaryBundle';

const ChecklistMDX: React.FC<{ cid: string }> = ({ cid }) => {
  const { getInputBlockData, gid, currentGroupData } = useInputBlockGroupData();
  const {
    data: mdxSummaryBundle,
    isLoading,
    error,
  } = useMDXSummaryBundle(gid, cid);

  const MDXComponent = useMemo(() => {
    // console.log('MDXComponent:', mdxSummaryBundle);
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
  }, [mdxSummaryBundle, currentGroupData]);

  // Memoize the rendered content based on both MDXComponent and checklist data
  const group = useMemo(() => {
    if (!currentGroupData) return null;
    return getInputBlockData(cid);
  }, [currentGroupData]);

  const renderedContent = useMemo(() => {
    if (!MDXComponent || !group) return null;

    return (
      <div className="mdx-content">
        {MDXComponent.summary && (
          <div className="mt-4 text-sm text-gray-400">
            {MDXComponent.summary(group.ibdata.data)}
          </div>
        )}
        {MDXComponent.progress && (
          <div className="mt-4 text-sm text-gray-400">
            {MDXComponent.progress(group.ibdata.data)}%
          </div>
        )}
      </div>
    );
  }, [MDXComponent, group]);

  if (!group) {
    return <div>Group {cid} Not Found</div>;
  }

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
  group: InputBlockGroupData;
}> = ({ group }) => {
  // const { setSelectedChecklist } = useChecklists();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const flow = searchParams.get('flow');

  const sortedList = group.input_blocks;

  const handleChecklistClick = (cid: string) => {
    const selectedInputBlock = sortedList.find((x) => x.cid === cid);
    if (selectedInputBlock) {
      // setSelectedChecklist(selectedInputBlock);
      let url = `/inputs/groups/${group.gid}/${group.group}/${group.id}/${cid}`;
      
      // Preserve query parameters if they exist
      const queryParams = new URLSearchParams();
      if (flow) {
        queryParams.append('flow', flow);
      }
      if (projectId) {
        queryParams.append('projectId', projectId);
      }
      
      // Append query parameters if any exist
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      router.push(url);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto bg-secondary-950 p-1 scrollbar-hidden">
      {sortedList.map((ib) => (
        <Card
          key={ib.cid}
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
          onClick={() => handleChecklistClick(ib.cid)}>
          <div className="flex flex-col gap-0">
            <div className="text-lg font-medium">{ib.name}</div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date(group.updated_at + "Z").toLocaleDateString()}
            </div>
            <ChecklistMDX cid={ib.cid} />
          </div>
        </Card>
      ))}
    </div>
  );
};

export default GroupDetail;
