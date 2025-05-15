'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useMemo } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { Modal } from '@/lib/components/modal';
import { useMDXBundle } from '../hooks/useMDXBundle';
// import useUpdateChecklist from '../hooks/useUpdateChecklist';
import { Alert, AlertDescription } from '../utils/Alert';
import { Skeleton } from '../utils/Skeletion';
import styles from './ChecklistDetail.module.css';
import type { MDXProps } from '../utils/types';
interface ChecklistDetailProps {
  cid: string;
  gid: string;
}

const ChecklistDetail: React.FC<ChecklistDetailProps> = ({ cid, gid }) => {
  const {
    getInputBlockData,
    getGroupDataById,
    setInputBlockData,
    currentGroupData,
  } = useInputBlockGroupData();
  // console.log('ChecklistDetail:', currentGroupData);

  const groupData = getGroupDataById();
  // console.log('groupdData: ', groupData);
  const ibdata = useMemo(() => {
    if (!currentGroupData) return null;
    return getInputBlockData(cid);
  }, [currentGroupData]);
  // console.log('ibdata: ', ibdata);

  const { data: mdxBundle } = useMDXBundle(gid, cid);
  // console.log('mdxBundle', mdxBundle);

  const [localData, setLocalData] = useState(ibdata?.ibdata.data || {});
  // const [, setShowSaveModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    setLocalData(ibdata?.ibdata.data || {});
  }, [ibdata]);

  const handleDataChange = (key: string, value: string) => {
    // if (!checklistData) return;
    // console.log('handleDataChange', key, value);

    const newData = {
      ...localData,
      [key]: value,
    };

    setLocalData(newData);
    setInputBlockData(cid, newData);
    // setHasUnsavedChanges(true);
  };

  const handleClearFields = () => {
    setShowClearModal(false); // Close confirmation modal

    // const clearedData = Object.keys(localData).reduce(
    //   (acc, key) => {
    //     acc[key] = '';
    //     return acc;
    //   },
    //   {} as Record<string, string>
    // );
    const clearedData = {};
    setLocalData(clearedData);
    setInputBlockData(cid, clearedData);
    setTimeout(() => {
      // Use history API for more reliable refresh
      window.location.href = window.location.href;
    }, 1000);
  };

  const MDXComponent = React.useMemo(() => {
    if (!mdxBundle?.code) return null;

    try {
      const context = {
        React,
        _jsx_runtime: ReactJSXRuntime,
      };

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

  // if (isLoadingChecklist || isLoadingMDX) {
  //   return (
  //     <div className="space-y-4 p-4">
  //       <Skeleton className="h-8 w-64" />
  //       <Skeleton className="h-64 w-full" />
  //     </div>
  //   );
  // }

  // if (checklistError || mdxError) {
  //   return (
  //     <Alert variant="destructive">
  //       <AlertDescription>
  //         {checklistError?.message || mdxError?.message || 'An error occurred'}
  //       </AlertDescription>
  //     </Alert>
  //   );
  // }

  if (!MDXComponent || !groupData) {
    return (
      <Alert>
        <AlertDescription>No checklist data available</AlertDescription>
      </Alert>
    );
  }
  if (!ibdata || !groupData) return null;
  // if (!MDXComponent) return null;
  // const updateMutation = useUpdateChecklist();

  return (
    <div className={styles['mdx-wrapper']}>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{ibdata.inputBlock.name}</h1>
          <div className="flex items-center gap-4">
            {/* {lastSaved && (
              <span className="text-sm text-secondary-500">
                Last saved: {lastSaved.toLocaleString()}
              </span>
            )}
            <button
              className={`rounded px-4 py-2 font-semibold ${
                hasUnsavedChanges
                  ? 'cursor-pointer bg-primary-700 text-white hover:bg-primary-600'
                  : 'cursor-not-allowed bg-secondary-700 text-secondary-500'
              } disabled:cursor-not-allowed disabled:bg-secondary-700 disabled:text-secondary-500`}
              onClick={saveChanges}
              disabled={!hasUnsavedChanges}>
              {isSaving ? 'Saving...' : 'Save'}
            </button> */}

            <button
              className="rounded border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-secondary-400"
              onClick={() => setShowClearModal(true)}>
              Clear Fields
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Last updated: {new Date(groupData.updated_at + "Z").toLocaleString()}
        </p>
      </div>
      <MDXComponent
        data={localData as Record<string, string>} // Ensure data is cast to the correct type
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
  );
};

export default ChecklistDetail;
