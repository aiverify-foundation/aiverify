'use client';
import React, { useState } from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';

const ActionButtons: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex">
      <Button
        pill
        textColor="white"
        variant={ButtonVariant.OUTLINE}
        size="sm"
        text="ADD CHECKLISTS"
        onClick={() => setIsModalOpen(true)}
      />

      {isModalOpen && (
        <Modal
          heading="Add Checklists"
          onCloseIconClick={() => setIsModalOpen(false)}
          enableScreenOverlay
          primaryBtnLabel="Upload Excel"
          secondaryBtnLabel="Create New"
          onPrimaryBtnClick={() => {
            setIsModalOpen(false);
            window.location.href = '/inputs/checklists/upload/excel';
          }}
          onSecondaryBtnClick={() => {
            setIsModalOpen(false);
            window.location.href = '/inputs/checklists/upload/manual';
          }}>
          <p className="text-primary-100">
            Choose an option to add checklists:
          </p>
        </Modal>
      )}
    </div>
  );
};

export default ActionButtons;
