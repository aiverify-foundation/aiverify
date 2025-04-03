'use client';

import React from 'react';
import { Modal } from '@/lib/components/modal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      heading={`Delete ${title}`}
      enableScreenOverlay={true}
      onCloseIconClick={onClose}
      onPrimaryBtnClick={onConfirm}
      onSecondaryBtnClick={onClose}
      primaryBtnLabel="Delete"
      secondaryBtnLabel="Cancel"
      width="500px"
      height="300px">
      <p className="text-white">
        Are you sure you want to delete &ldquo;
        <span className="font-semibold">{itemName}</span>&rdquo;?
      </p>
      <p className="mt-2text-secondary-400">This action cannot be undone.</p>
    </Modal>
  );
};
