'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { QueryProvider } from '@/app/inputs/fairnesstree/components/QueryProvider';
import { FairnessTreeUploadModal } from './FairnessTreeUploadModal';
import { FairnessTreeProvider } from '../context/FairnessTreeContext';

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

// Reusable modal wrapper for other components
export function FairnessTreeModalWrapper({
  isOpen,
  onClose,
  gid = 'aiverify.stock.fairness_metrics_toolbox_for_classification',
  cid = 'fairness_tree',
}: {
  isOpen: boolean;
  onClose: () => void;
  gid?: string;
  cid?: string;
}) {
  return (
    <QueryProvider>
      <FairnessTreeProvider>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <FairnessTreeUploadModal
            isOpen={isOpen}
            onClose={onClose}
            gid={gid}
            cid={cid}
          />
        </div>
      </FairnessTreeProvider>
    </QueryProvider>
  );
}
