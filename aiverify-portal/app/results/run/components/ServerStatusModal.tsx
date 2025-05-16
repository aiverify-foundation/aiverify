'use client';

import React from 'react';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';

interface ServerStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServerStatusModal({
  isOpen,
  onClose,
}: ServerStatusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="max-w-2xl rounded-lg bg-secondary-800 p-8">
        <div className="mb-4 flex items-center">
          <Icon
            name={IconName.Warning}
            size={24}
            color="#FF9800"
          />
          <h2 className="ml-2 text-xl font-bold">
            Test Engine Worker Not Running
          </h2>
        </div>

        <p className="mb-4">
          The Test Engine Worker service needs to be running to execute tests.
          Please start the service by following the instructions in the
          README.md file.
        </p>

        <p className="mb-6 text-sm text-gray-400">
          The Test Engine Worker needs to be running for test execution. Please
          keep the terminal window open while running tests.
        </p>

        <div className="flex justify-end">
          <Button
            variant={ButtonVariant.PRIMARY}
            text="Close"
            size="md"
            onClick={onClose}
          />
        </div>
      </div>
    </div>
  );
}
