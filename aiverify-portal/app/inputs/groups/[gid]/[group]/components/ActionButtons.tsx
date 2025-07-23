'use client';
import { useSearchParams } from 'next/navigation';
import React, { useState, useTransition } from 'react';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import { useInputBlockGroupSubmission } from '../upload/hooks/useUploadSubmission';
import { useMDXSummaryBundle } from '../[groupId]/hooks/useMDXSummaryBundle';
import { EXPORT_PROCESS_CHECKLISTS_CID } from '../[groupId]/hooks/useProcessChecklistExport';

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

  // Dynamically check if the plugin has import/export functionality
  const { data: importBundle } = useMDXSummaryBundle(gid, EXPORT_PROCESS_CHECKLISTS_CID);
  const hasImportFunction = !!importBundle?.code;

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

  const [checklistName, setChecklistName] = useState(group); // default to group

  const addNewChecklist = () => {
    // TODO: handle errors
    startTransition(async () => {
      const res = await submitChecklist({
        gid: gid,
        group: group,
        name: checklistName, // use the text field value
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
    if (hasImportFunction) {
      // Show modal with import options for plugins that support Excel import
      setIsModalOpen(true);
    } else {
      // Directly create new checklist for plugins without import functionality
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
          heading="Add Input"
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
          }}>
          <p className="text-primary-100">
            Name :
          </p>
          <input
            type="text"
            className="border rounded px-2 py-1 mt-2 w-full text-black"
            value={checklistName}
            onChange={e => setChecklistName(e.target.value)}
            placeholder="Checklist name"
            maxLength={128}
          />
        </Modal>
      )}
    </div>
  );
};

export default ActionButtons;
