'use client';
import { useSearchParams } from 'next/navigation';
import React, { useState, useTransition } from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import { useInputBlockGroupSubmission } from '../upload/hooks/useUploadSubmission';

interface ActionButtonsProps {
  gid: string;
  group: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  gid,
  group,
}: ActionButtonsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, startTransition] = useTransition();
  const { submitInputBlockGroup: submitChecklist } = useInputBlockGroupSubmission();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const flow = searchParams.get('flow');

  const encodedGroup = encodeURIComponent(group);
  const encodedGID = encodeURIComponent(gid);

  // Helper to build URLs with query parameters
  const buildUrlWithParams = (baseUrl: string) => {
    if (!projectId && !flow) return baseUrl;
    
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (flow) params.append('flow', flow);
    
    return `${baseUrl}?${params.toString()}`;
  };

  const addNewChecklist = () => {
    // TODO: handle errors
    startTransition(async () => {
      const res = await submitChecklist({
        gid: gid,
        group: group,
        name: group,
        input_blocks: [],
      });
      console.log('res:', res);
      if (res && res['id']) {
        const groupId = res['id'];
        const url = buildUrlWithParams(`/inputs/groups/${encodedGID}/${encodedGroup}/${groupId}`);
        window.location.href = url;
      }
    });
  };

  const handleAddChecklists = () => {
    if (gid === 'aiverify.stock.process_checklist') {
      // TODO: fix hardcode
      setIsModalOpen(true);
    } else {
      // alert('Hi');
      addNewChecklist();
    }
  };

  return (
    <div className="flex">
      <Button
        pill
        textColor="white"
        variant={ButtonVariant.OUTLINE}
        size="sm"
        text="ADD CHECKLISTS"
        onClick={() => handleAddChecklists()}
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
            const url = buildUrlWithParams(`/inputs/groups/${encodedGID}/${encodedGroup}/upload/excel`);
            window.location.href = url;
          }}
          onSecondaryBtnClick={() => {
            setIsModalOpen(false);
            addNewChecklist();
            // window.location.href = `/inputs/groups/${encodedGID}/${encodedGroup}/upload/manual`;
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
