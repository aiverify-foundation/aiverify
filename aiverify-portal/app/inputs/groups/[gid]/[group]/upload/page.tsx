'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import React, { useState, useTransition } from 'react';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import LayoutHeader from '../components/LayoutHeader';

const UploadPage = () => {
  const [activeCard, setActiveCard] = useState<string>('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');
  const flow = searchParams.get('flow');
  const isProjectFlow = !!projectId;
  const { gid, group } = useInputBlockGroupData();
  const [, startTransition] = useTransition();

  const handleMethodSelect = (method: string) => {
    setActiveCard(method);
  };

  const handleNext = () => {
    if (activeCard) {
      if (activeCard === 'manual') {
        startTransition(async () => {
          const response = await fetch('/api/input_block_data/groups', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              gid,
              group,
              name: group,
              input_blocks: [],
            }),
          });

          if (response.ok) {
            console.log('Data saved successfully');
          } else {
            console.error('Failed to save data');
          }
          const data = await response.json();
          const baseUrl = `/inputs/groups/${gid}/${group}/${data['id']}`;
          const url = isProjectFlow
            ? `${baseUrl}?flow=${flow}&projectId=${projectId}`
            : baseUrl;
          router.push(url);
        });
      } else {
        const baseUrl = `/inputs/groups/${gid}/${group}/upload/${activeCard}`;
        const url = isProjectFlow
          ? `${baseUrl}?flow=${flow}&projectId=${projectId}`
          : baseUrl;
        router.push(url);
      }
    }
  };

  const handleBackProject = () => {
    if (isProjectFlow) {
      router.push(`/project/select_data?flow=${flow}&projectId=${projectId}`);
    }
  };

  const renderOptionCard = (
    method: string,
    title: string,
    descriptions: string[]
  ) => (
    <div
      className={`flex h-[350px] w-[50%] cursor-pointer flex-col rounded-lg border p-6 transition-all duration-200`}
      style={{
        borderColor:
          activeCard === method
            ? 'var(--color-primary-600)'
            : 'var(--color-secondary-300)',
        backgroundColor:
          activeCard === method
            ? 'var(--color-primary-600)'
            : 'var(--color-secondary-950)',
      }}
      onClick={() => handleMethodSelect(method)}>
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-full border ${activeCard === method ? 'border-purple-400' : 'border-zinc-700'}`}>
          {activeCard === method && (
            <div className="h-2.5 w-2.5 rounded-full bg-purple-400" />
          )}
        </div>
        <Icon
          name={IconName.Folder}
          size={20}
          color={activeCard === method ? '#C084FC' : '#A1A1AA'}
        />
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      {descriptions.map((desc, index) => {
        const isNote = desc.startsWith('*');
        const [sectionTitle, content] = desc.split(': ');

        if (content) {
          return (
            <div
              key={index}
              className="mt-4">
              <h3 className="text-sm font-medium text-zinc-400">
                {sectionTitle}
              </h3>
              <p className="mt-1 text-sm text-white">{content}</p>
            </div>
          );
        }

        return (
          <p
            key={index}
            className={`mt-2 text-sm ${isNote ? 'text-zinc-400' : 'text-white'}`}>
            {desc}
          </p>
        );
      })}
    </div>
  );

  const renderSelectionOptions = () => (
    <div className="relative flex flex-col overflow-y-auto">
      <div className="flex items-center">
        <div className="pl-10">
          {!flow ? (
            <Link
              href={`/inputs/groups/${gid}/${group}?projectId=${projectId}&flow=${flow}`}
              className="flex items-center gap-2 text-white hover:text-primary-300">
              <Icon
                name={IconName.ArrowLeft}
                size={30}
                color="currentColor"
              />
              <h1 className="text-3xl font-bold text-white">
                Add New Checklist
              </h1>
            </Link>
          ) : (
            <h1 className="text-3xl font-bold text-white">Add New Checklist</h1>
          )}
          <h3 className="text-white">
            How would you like to create your checklist?
          </h3>
        </div>
      </div>
      <div className="flex flex-grow items-center gap-10 p-10">
        {renderOptionCard('manual', 'Manual Entry', [
          'Create checklist items one by one',
          'Full control over checklist structure',
          'Interactive form-based entry',
          '*Best for creating new checklists from scratch',
        ])}
        {renderOptionCard('excel', 'Excel Upload', [
          'Upload pre-formatted Excel files',
          'Bulk import of checklist items',
          'Template-based approach',
          '*Best for importing existing checklists',
        ])}
      </div>
      <div className="mt-6 mt-auto flex items-center justify-end pr-6">
        <Button
          variant={ButtonVariant.PRIMARY}
          className="mb-8"
          size="sm"
          onClick={handleNext}
          disabled={!activeCard}
          text="NEXT"
        />
      </div>
    </div>
  );

  return (
    <>
      <LayoutHeader
        projectId={projectId}
        onBack={handleBackProject}
      />
      <div className="mt-6 flex h-[calc(100vh-150px)] overflow-y-auto rounded-2xl bg-secondary-950 p-6 text-white">
        <div className="mx-auto h-full w-full">{renderSelectionOptions()}</div>
      </div>
    </>
  );
};

export default UploadPage;
