// ActionButtons.tsx
'use client';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';
import { FairnessTreeUploadModal } from './FairnessTreeUploadModal';

const ActionButtons: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const params = useParams();
  const gid = params.gid as string;
  const cid = params.cid as string;
  console.log('gid', gid);
  console.log('cid', cid);

  return (
    <div className="flex">
      <Button
        pill
        textColor="white"
        variant={ButtonVariant.OUTLINE}
        size="sm"
        text="ADD INPUT BLOCK"
        onClick={() => setIsModalOpen(true)}
      />
      <FairnessTreeUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        gid={gid}
        cid={cid}
      />
    </div>
  );
};

export default ActionButtons;
