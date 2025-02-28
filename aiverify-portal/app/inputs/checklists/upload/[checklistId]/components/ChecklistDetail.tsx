'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useChecklists } from '@/app/inputs/checklists/upload/context/ChecklistsContext';
import { useMDXBundle } from '../../../[groupId]/[checklistId]/hooks/useMDXBundle';
import { Modal } from '@/lib/components/modal';
import { useRouter } from 'next/navigation';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { Skeleton } from '../../../[groupId]/[checklistId]/utils/Skeletion';
import dynamic from 'next/dynamic';
import styles from './ChecklistDetail.module.css';

interface ChecklistDetailProps {
  id: string;
}

interface MDXProps {
  data: Record<string, string>;
  onChangeData: (key: string, value: string) => void;
}

const ChecklistDetail: React.FC<ChecklistDetailProps> = ({ id }) => {
  const { checklists, updateChecklistData, setSelectedChecklist } =
    useChecklists();
  const checklist = useMemo(
    () => checklists.find((c) => c.cid === id),
    [checklists, id]
  );

  const [localData, setLocalData] = useState<Record<string, string>>(
    checklist?.data || {}
  );
  const [showClearModal, setShowClearModal] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Sync state with context when checklist updates
  useEffect(() => {
    if (checklist) {
      setLocalData(checklist.data || {});
      setSelectedChecklist(checklist);
    }
  }, [checklist, setSelectedChecklist]);

  const handleDataChange = useCallback(
    (key: string, value: string) => {
      if (!checklist) return;

      const newData = { ...localData, [key]: value };
      setLocalData(newData);
      updateChecklistData(id, newData);
      setLastSaved(new Date());
    },
    [checklist, localData, id, updateChecklistData]
  );

  const { data: mdxBundle, isLoading: isLoadingMDX } = useMDXBundle(
    checklist?.gid,
    checklist?.cid
  );

  const MDXComponent = useMemo(() => {
    if (!mdxBundle?.code) return null;

    try {
      const context = { React, _jsx_runtime: ReactJSXRuntime };
      const componentFn = new Function(...Object.keys(context), mdxBundle.code);
      const Component = componentFn(
        ...Object.values(context)
      ) as React.ComponentType<MDXProps>;

      return dynamic(() => Promise.resolve(Component), {
        loading: () => <Skeleton className="h-64 w-full" />,
        ssr: false,
      });
    } catch (error) {
      console.error('Error creating MDX component:', error);
      return null;
    }
  }, [mdxBundle]);

  const handleClearFields = useCallback(() => {
    setLocalData({});
    if (checklist) {
      updateChecklistData(checklist.cid, {});
    }
    setShowClearModal(false);
  }, [checklist, updateChecklistData]);

  if (!checklist || !MDXComponent) {
    return <div>No checklist data available</div>;
  }

  return (
    <div className={styles['mdx-wrapper']}>
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{checklist.name}</h1>
          {lastSaved && (
            <span className="text-sm text-secondary-500">
              Last saved: {lastSaved.toLocaleString()}
            </span>
          )}
        </div>

        <MDXComponent
          data={localData}
          onChangeData={handleDataChange}
        />

        {showClearModal && (
          <Modal
            heading="Confirm Clear"
            onCloseIconClick={() => setShowClearModal(false)}
            primaryBtnLabel="Yes, Clear"
            secondaryBtnLabel="Cancel"
            onPrimaryBtnClick={handleClearFields}
            onSecondaryBtnClick={() => setShowClearModal(false)}
            enableScreenOverlay>
            <p className="text-center text-lg">
              Are you sure you want to clear all fields? This action cannot be
              undone.
            </p>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default ChecklistDetail;
