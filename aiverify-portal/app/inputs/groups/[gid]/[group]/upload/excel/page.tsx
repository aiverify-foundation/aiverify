'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import LayoutHeader from '../../components/LayoutHeader';
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
    <div className="mt-6 flex h-screen flex-col">
      <LayoutHeader
        projectId={projectId}
        onBack={handleBackToProject}
      />
      <div className="flex-1">
        <ExcelUploader />
      </div>
    </div>
  );
};

export default UploadPage;
