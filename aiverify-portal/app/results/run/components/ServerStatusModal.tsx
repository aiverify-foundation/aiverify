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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-w-2xl rounded-lg bg-white p-8">
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
          Please start the service by following these instructions:
        </p>

        <div className="mb-4 rounded-md bg-gray-100 p-4">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Open a terminal window</li>
            <li>Navigate to the AI Verify installation directory</li>
            <li>
              Activate the Python virtual environment:
              <pre className="mt-1 rounded bg-gray-200 p-2">
                source .venv/bin/activate
              </pre>
            </li>
            <li>
              Start the test engine worker:
              <pre className="mt-1 rounded bg-gray-200 p-2">
                cd aiverify-test-engine-worker
                <br />
                python -m aiverify_test_engine_worker
              </pre>
            </li>
          </ol>
        </div>

        <p className="mb-6 text-sm text-gray-600">
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
