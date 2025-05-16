'use client';

import dynamic from 'next/dynamic';
import React, { useState, useMemo, useCallback } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { InputBlockDataPayload } from '@/app/types';
import { Modal } from '@/lib/components/modal';
import { useMDXBundle } from '../../../../[groupId]/[cid]/hooks/useMDXBundle';
import { Skeleton } from '../../../../[groupId]/[cid]/utils/Skeletion';
// import { useChecklists } from '../../../context/ChecklistsContext';
import styles from './ChecklistDetail.module.css';

interface ChecklistDetailProps {
  cid: string;
  data: InputBlockDataPayload;
  onDataUpdated: (newData: InputBlockDataPayload) => void;
}

interface MDXProps {
  data: Record<string, string>;
  onChangeData: (key: string, value: string) => void;
}

// Helper function to convert InputBlockDataPayload to Record<string, string>
const convertToStringRecord = (
  data: InputBlockDataPayload
): Record<string, string> => {
  const result: Record<string, string> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      result[key] = '';
    } else if (typeof value === 'string') {
      result[key] = value;
    } else {
      // Convert any non-string values to string representation
      try {
        result[key] = JSON.stringify(value);
      } catch {
        // Fall back to String() if JSON.stringify fails
        result[key] = String(value);
      }
    }
  });

  return result;
};

const ChecklistDetail: React.FC<ChecklistDetailProps> = ({
  cid,
  data,
  onDataUpdated,
}) => {
  // const { checklists, updateChecklistData, setSelectedChecklist } =
  //   useChecklists();
  const { inputBlocks } = useInputBlockGroupData();
  const inputBlock = useMemo(
    () => (inputBlocks || []).find((c) => c.cid === cid),
    [inputBlocks, cid]
  );

  const [localData, setLocalData] = useState<InputBlockDataPayload>(data);
  const [showClearModal, setShowClearModal] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Sync state with context when checklist updates
  // useEffect(() => {
  // if (inputBlock) {
  // setLocalData(inputBlock || {});
  // setLocalData({});
  // setSelectedChecklist(checklist);
  // }
  // }, [inputBlock /* setSelectedChecklist*/]);

  const handleDataChange = useCallback(
    (key: string, value: string) => {
      if (!inputBlock) return;

      const newData = { ...localData, [key]: value };
      setLocalData(newData);
      onDataUpdated(newData);
      // updateChecklistData(id, newData);
      setLastSaved(new Date());
    },
    [inputBlock, localData, onDataUpdated /*updateChecklistData*/]
  );

  console.log('checklist used for mdx bundle', inputBlock);
  const { data: mdxBundle } = useMDXBundle(inputBlock?.gid, inputBlock?.cid);

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
    if (inputBlock) {
      // updateChecklistData(checklist.cid, {});
    }
    setShowClearModal(false);
  }, [inputBlock /*updateChecklistData*/]);

  // Convert localData to string record for MDXComponent
  const stringData = useMemo(
    () => convertToStringRecord(localData),
    [localData]
  );

  if (!inputBlock || !MDXComponent) {
    return <div>No checklist data available</div>;
  }

  return (
    <div className={styles['mdx-wrapper']}>
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{inputBlock.name}</h1>
          {lastSaved && (
            <span className="text-sm text-secondary-500">
              Last saved: {lastSaved.toLocaleString()}
            </span>
          )}
        </div>

        <MDXComponent
          data={stringData}
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
