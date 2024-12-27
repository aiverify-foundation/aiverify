'use client';

import React, { useState, useEffect } from 'react';
import { TestModel } from '@/app/models/utils/types';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import { DeleteIcon } from '@/app/models/utils/icons';
//import { useDeletePlugin } from '../hooks/useDeletePlugin';


type Props = {
  model: TestModel | null;
};

export default function ModelDetail({ model }: Props) {
  const [currentModel, setCurrentPlugin] = useState<TestModel | null>(model);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDeleteGid, setConfirmDeleteGid] = useState<string | null>(null);
  const [isConfirmation, setIsConfirmation] = useState(true);

  if (!currentModel) {
    return (
      <div className="text-white text-center mt-20">
        <p>Select a model to see details here.</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary-950 h-full text-white rounded-lg shadow-lg p-6 flex flex-col overflow-hidden">
    {/* Delete Confirmation Popup */}
    {isModalVisible && isConfirmation && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <Modal
          bgColor="var(--color-primary-500)"
          textColor="white"
          onCloseIconClick={() => setIsModalVisible(false)}
          enableScreenOverlay
          heading="Confirm Deletion"
          height={200}
          primaryBtnLabel="DELETE"
          secondaryBtnLabel="CANCEL"
          // Handle actual deletion
          onSecondaryBtnClick={() => setIsModalVisible(false)} // Close the modal
        >
          <p>Are you sure you want to delete this plugin?</p>
        </Modal>
      </div>
    )}

        {/* Metadata of Plugin */}
        <div className="pb-4 mb-4">
          <div className='flex items-center justify-between'>
            <h3 className="text-2xl font-semibold mb-2">{currentModel.name}</h3>
              <DeleteIcon />
          </div>
          <div className="space-y-1 text-base">
          <p>{currentModel.description}</p>
          <p></p>
          <p>
              <span className="font-semibold">Installed on:</span>{' '}
              {new Date(currentModel.updated_at).toLocaleString('en-GB')}
          </p>
          </div>
        </div>
    </div>

  );
}