'use client';

import React from 'react';
import { Modal } from '@/lib/components/modal';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error';
}

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      heading={title}
      enableScreenOverlay={true}
      onCloseIconClick={onClose}
      width="500px"
      height="200px">
      <p className="text-white">{message}</p>
    </Modal>
  );
};
