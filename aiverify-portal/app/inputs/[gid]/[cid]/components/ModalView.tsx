'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { QueryProvider } from '@/app/inputs/[gid]/[cid]/components/QueryProvider';
import { FairnessTreeProvider } from '@/app/inputs/[gid]/[cid]/context/FairnessTreeContext';
import { FairnessTreeUploadModal } from './FairnessTreeUploadModal';

// Modal content for project flow
export function FairnessTreeModalContent({
  gid,
  cid,
  projectId,
  flow,
}: {
  gid: string;
  cid: string;
  projectId: string;
  flow: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const router = useRouter();

  const handleClose = () => {
    setIsModalOpen(false);
    router.push(`/project/select_data?projectId=${projectId}&flow=${flow}`);
  };

  return (
    <QueryProvider>
      <FairnessTreeProvider>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <FairnessTreeUploadModal
            isOpen={isModalOpen}
            onClose={handleClose}
            gid={gid}
            cid={cid}
          />
        </div>
      </FairnessTreeProvider>
    </QueryProvider>
  );
}
