'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useChecklist } from '../hooks/useChecklist';
import { useMDXBundle } from '../hooks/useMDXBundle';
import { Skeleton } from '../utils/Skeletion';
import { Alert, AlertDescription } from '../utils/Alert';
import { Modal } from '@/lib/components/modal';
import type { MDXProps } from '../utils/types';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import styles from './ChecklistDetail.module.css';
import useUpdateChecklist from '../hooks/useUpdateChecklist';

interface ChecklistDetailProps {
  id: string;
}

const ChecklistDetail: React.FC<ChecklistDetailProps> = ({ id }) => {
  const {
    data: checklistData,
    isLoading: isLoadingChecklist,
    error: checklistError,
  } = useChecklist(id);

  const {
    data: mdxBundle,
    isLoading: isLoadingMDX,
    error: mdxError,
  } = useMDXBundle(checklistData?.gid, checklistData?.cid);

  const updateMutation = useUpdateChecklist();
  const [localData, setLocalData] = useState(checklistData?.data || {});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalData(checklistData?.data || {});
    setHasUnsavedChanges(false);
  }, [checklistData]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, []);

  const saveChanges = async () => {
    if (!checklistData) return;

    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          data: localData,
          name: checklistData.name,
          group: checklistData.group,
        },
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setShowSaveModal(true); // Show save success modal
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataChange = (key: string, value: string) => {
    if (!checklistData) return;

    const newData = {
      ...localData,
      [key]: value,
    };

    setLocalData(newData);
    setHasUnsavedChanges(true);

    // Auto-save logic
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    autoSaveTimeout.current = setTimeout(() => {
      saveChanges();
    }, 10000); // 2 second debounce delay
  };

  const handleClearFields = () => {
    setShowClearModal(false); // Close confirmation modal

    const clearedData = Object.keys(localData).reduce(
      (acc, key) => {
        acc[key] = '';
        return acc;
      },
      {} as Record<string, string>
    );

    setLocalData(clearedData);
    setHasUnsavedChanges(true);

    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
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

  if (isLoadingChecklist || isLoadingMDX) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (checklistError || mdxError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {checklistError?.message || mdxError?.message || 'An error occurred'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!MDXComponent || !checklistData) {
    return (
      <Alert>
        <AlertDescription>No checklist data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={styles['mdx-wrapper']}>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{checklistData.name}</h1>
          <div className="flex items-center gap-4">
            {lastSaved && (
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
            </button>

            <button
              className="rounded border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-secondary-400"
              onClick={() => setShowClearModal(true)}>
              Clear Fields
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Last updated: {new Date(checklistData.updated_at).toLocaleString()}
        </p>
      </div>

      <MDXComponent
        data={localData}
        onChangeData={handleDataChange}
      />

      {/* Clear Fields Confirmation Modal */}
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
