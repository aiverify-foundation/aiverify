'use client';

import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import LayoutHeader from '@/app/results/components/LayoutHeader';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';

const UploadPage = () => {
  const [activeCard, setActiveCard] = useState<string>('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId');
  const flow = searchParams.get('flow');
  const isProjectFlow = !!projectId;

  const handleMethodSelect = (method: string) => {
    setActiveCard(method);
  };

  const handleNext = () => {
    if (activeCard) {
      const baseUrl = `/results/upload/${activeCard}`;
      const url = isProjectFlow
        ? `${baseUrl}?flow=${flow}&projectId=${projectId}`
        : baseUrl;
      router.push(url);
    }
  };

  const handleBackProject = () => {
    if (isProjectFlow && projectId && flow) {
      // Navigate back to the project select_data page properly to trigger fresh data fetch
      const backUrl = `/project/select_data?flow=${flow}&projectId=${projectId}`;
      console.log('Navigating back to project page:', backUrl);
      router.push(backUrl);
    } else {
      // Fallback to history.back() if we don't have the necessary parameters
      window.history.back();
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
          <h1 className="text-2xl font-bold text-white">Upload Test Results</h1>
          <h3 className="text-white">
            How would you like to upload your test results?
          </h3>
        </div>
      </div>
      <div className="flex flex-grow items-center gap-10 p-10">
        {renderOptionCard('zipfile', 'Upload Zip File', [
          'Supported format: ZIP',
          '*Contains test results exported from another AI Verify instance',
          'How it works: AI Verify will import the test results from the ZIP file.',
        ])}
        {renderOptionCard('manual', 'Manual Upload', [
          'Supported formats: JSON',
          'Supported test types: All test types',
          'How it works: AI Verify will process the uploaded files as test results.',
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
    <div className="mt-6 flex h-[calc(100vh-150px)] overflow-y-auto rounded-2xl bg-secondary-950 pt-6 text-white">
      <LayoutHeader
        projectId={projectId}
        onBack={handleBackProject}
      />
      <div className="mx-auto h-full w-full p-2">
        {renderSelectionOptions()}
      </div>
    </div>
  );
};

export default UploadPage;
