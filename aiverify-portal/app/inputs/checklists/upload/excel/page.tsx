'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import LayoutHeader from '@/app/inputs/checklists/components/LayoutHeader';
import ExcelUploader from './components/ExcelUploader';

const UploadPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const flow = searchParams.get('flow');

  const handleBackToProject = () => {
    if (flow && projectId) {
      router.push(`/project/select_data?flow=${flow}&projectId=${projectId}`);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <LayoutHeader
        projectId={projectId}
        onBack={handleBackToProject}
      />
      <div className="flex-1 p-6">
        <ExcelUploader />
      </div>
    </div>
  );
};

export default UploadPage;
