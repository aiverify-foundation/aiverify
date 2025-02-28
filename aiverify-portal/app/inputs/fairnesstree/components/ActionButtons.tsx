// ActionButtons.tsx
'use client';
import React, { useState } from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';
import { FairnessTreeUploadModal } from './FairnessTreeUploadModal';

const ActionButtons: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex">
      <Button
        pill
        textColor="white"
        variant={ButtonVariant.OUTLINE}
        size="sm"
        text="ADD FAIRNESS TREE"
        onClick={() => setIsModalOpen(true)}
      />
      <FairnessTreeUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        gid="aiverify.stock.fairness_metrics_toolbox_for_classification" // Replace with actual gid
        cid="fairness_tree" // Replace with actual cid
      />
    </div>
  );
};

export default ActionButtons;
