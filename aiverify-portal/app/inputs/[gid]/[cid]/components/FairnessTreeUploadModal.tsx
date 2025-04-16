// FairnessTreeUploadModal.tsx
'use client';

import { getMDXComponent } from 'mdx-bundler/client';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo, useEffect } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { useFairnessTree } from '@/app/inputs/[gid]/[cid]/context/FairnessTreeContext';
import { useMDXBundle } from '@/app/inputs/[gid]/[cid]/hooks/useMDXBundle';
import { useMDXSummaryBundle } from '@/app/inputs/[gid]/[cid]/hooks/useMDXSummaryBundle';
import { useSubmitFairnessTree } from '@/app/inputs/[gid]/[cid]/hooks/useSubmitFairnessTree';
import { InfoIcon } from '@/app/inputs/groups/[gid]/[group]/upload/utils/icons';
import { FairnessTreeData } from '@/app/inputs/utils/types';
import { Modal } from '@/lib/components/modal';
import './DecisionTree.css';
import { Tooltip } from './Tooltip';
interface FairnessTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gid: string;
  cid: string;
}

export const FairnessTreeUploadModal: React.FC<FairnessTreeModalProps> = ({
  isOpen,
  onClose,
  gid,
  cid,
}) => {
  const { data: mdxBundle, isLoading, error } = useMDXBundle(gid, cid);
  const {
    data: mdxSummaryBundle,
    isLoading: summaryLoading,
    error: summaryError,
  } = useMDXSummaryBundle(gid, cid);

  // Extract validation function from summary bundle
  const validationFunctions = useMemo(() => {
    if (!mdxSummaryBundle?.code) return null;

    try {
      const context = {
        React,
        jsx: ReactJSXRuntime.jsx,
        jsxs: ReactJSXRuntime.jsxs,
        _jsx_runtime: ReactJSXRuntime,
        Fragment: ReactJSXRuntime.Fragment,
      };

      const moduleFactory = new Function(
        ...Object.keys(context),
        `${mdxSummaryBundle.code}`
      );
      const moduleExports = moduleFactory(...Object.values(context));

      return {
        validate: moduleExports.validate,
        progress: moduleExports.progress,
        summary: moduleExports.summary,
      };
    } catch (error) {
      console.error('Error creating summary functions:', error);
      return null;
    }
  }, [mdxSummaryBundle]);

  const Component = useMemo(() => {
    if (!mdxBundle) {
      const MissingMdxMessage = () => <div>{`Missing mdx`}</div>;
      MissingMdxMessage.displayName = 'MissingMdxMessage';
      return MissingMdxMessage;
    }
    return getMDXComponent(mdxBundle.code);
  }, [mdxBundle]);

  const { addFairnessTree } = useFairnessTree();
  const { submitFairnessTree, isSubmitting } = useSubmitFairnessTree();

  const [name, setName] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const router = useRouter();

  const [treeData, setTreeData] = useState<FairnessTreeData>({
    sensitiveFeature: '',
    favourableOutcomeName: '',
    qualified: '',
    unqualified: '',
    metrics: [],
    selections: {
      nodes: [],
      edges: [],
    },
    selectedOutcomes: [],
  });

  // Update progress whenever form data changes
  useEffect(() => {
    if (validationFunctions?.progress) {
      try {
        const progress = validationFunctions.progress(treeData);
        setValidationProgress(progress || 0);
      } catch (error) {
        console.error('Error calculating progress:', error);
        setValidationProgress(0);
      }
    }
  }, [treeData, validationFunctions]);

  const validateForm = (): boolean => {
    // Check if name is provided
    if (!name) {
      setFormError('Please enter a name before submitting.');
      return false;
    }

    // Use validation function from summary bundle if available
    if (validationFunctions?.validate) {
      try {
        const isValid = validationFunctions.validate(treeData);
        if (!isValid) {
          setFormError('Please fill in all fields before submitting.');
          return false;
        }
      } catch (error) {
        console.error('Validation error:', error);
        setFormError('Error validating form data. Please check your inputs.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!validateForm()) {
      return;
    }

    const fairnessTreeData = {
      cid: cid,
      data: treeData,
      gid: gid,
      name: name,
      group: name,
    };

    try {
      await submitFairnessTree(fairnessTreeData);
      addFairnessTree({
        gid: gid,
        name,
        group: name,
        data: treeData,
        cid: cid,
      });
      setModalMessage('Tree updated successfully');
      setIsSubmitted(true); // Switch to the success/error modal
    } catch (error) {
      console.error('Error submitting fairness tree:', error);
      setModalError(`Error updating tree: ${error}`);
      setIsSubmitted(true); // Switch to the success/error modal
    }
  };

  const handleClose = () => {
    setName('');
    setFormError('');
    setTreeData({
      sensitiveFeature: '',
      favourableOutcomeName: '',
      qualified: '',
      unqualified: '',
      metrics: [],
      selections: {
        nodes: [],
        edges: [],
      },
      selectedOutcomes: [],
    });
    onClose();
  };

  if (!isOpen) return null;

  if (isLoading || summaryLoading) {
    return (
      <Modal
        heading="Loading Fairness Tree Editor"
        enableScreenOverlay={true}
        onCloseIconClick={handleClose}
        width={'90%'}
        height={'calc(100vh - 100px)'}>
        <div className="flex h-64 items-center justify-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-white" />
          <p className="ml-3 text-lg text-white">Loading content...</p>
        </div>
      </Modal>
    );
  }

  if (error || summaryError) {
    return (
      <Modal
        heading="Error"
        enableScreenOverlay={true}
        onCloseIconClick={handleClose}
        onPrimaryBtnClick={handleClose}
        primaryBtnLabel="Close"
        width="500px"
        height="auto">
        <div className="text-red-500">
          Error loading content: {(error || summaryError)?.message}
        </div>
      </Modal>
    );
  }

  return (
    <>
      {!isSubmitted ? (
        <Modal
          heading="Add Fairness Tree"
          enableScreenOverlay={true}
          onCloseIconClick={handleClose}
          onPrimaryBtnClick={handleSubmit}
          onSecondaryBtnClick={handleClose}
          primaryBtnLabel={isSubmitting ? 'Submitting...' : 'Submit'}
          secondaryBtnLabel="Cancel"
          width={'90%'}
          height={'calc(100% - 50px)'}>
          <div className="flex h-[calc(100%-50px)] flex-col">
            {/* Header with name input and progress bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
              {/* Name input field with tooltip */}
              <div className="sm:mb-0 sm:max-w-[70%] sm:flex-grow">
                <div className="flex items-center">
                  {/* Label and Tooltip */}
                  <div className="mr-2 flex items-center">
                    <label
                      htmlFor="name"
                      className="font-small mr-2 text-white">
                      Name
                    </label>
                    <Tooltip content="Enter a unique name for the fairness tree">
                      <InfoIcon className="h-5 w-5 text-gray-400 hover:text-gray-200" />
                    </Tooltip>
                  </div>

                  {/* Input Field */}
                  <input
                    id="name"
                    value={name}
                    required
                    onChange={(e) => {
                      setName(e.target.value);
                      setFormError('');
                    }}
                    className="h-[20px] flex-grow rounded border border-secondary-700 bg-secondary-900 p-3 text-white focus:border-primary-500 focus:outline-none"
                    placeholder="Enter a unique name for this fairness tree"
                  />
                </div>
              </div>

              {/* Completion Progress - Compact Display */}
              {validationFunctions?.progress && (
                <div className="flex items-center gap-2 sm:ml-auto sm:flex-shrink-0">
                  <div className="mr-2 whitespace-nowrap text-sm font-medium text-white">
                    Completion: {validationProgress}%
                  </div>
                  <div className="h-2 w-20 overflow-hidden rounded-full bg-secondary-700">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        validationProgress === 100
                          ? 'bg-green-500'
                          : 'bg-primary-500'
                      }`}
                      style={{ width: `${validationProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error message */}
            {formError && (
              <div className="mb-4 text-sm text-red-500">{formError}</div>
            )}

            {/* Main form content area */}
            <div className="decision-tree-container h-[calc(100%-50px)] flex-1 overflow-y-auto">
              {mdxBundle && (
                <Component
                  graphdata={mdxBundle.frontmatter.graphdata}
                  definitions={mdxBundle.frontmatter.definitions}
                  isEditing={true} // Always in edit mode for new trees
                  data={treeData}
                  onChangeData={(
                    key: string,
                    value:
                      | string
                      | string[]
                      | { nodes: string[]; edges: string[] }
                      | undefined
                  ) => setTreeData((prev) => ({ ...prev, [key]: value }))}
                />
              )}
            </div>
          </div>
        </Modal>
      ) : (
        <>
          {modalMessage && (
            <Modal
              heading="Success"
              enableScreenOverlay={true}
              onCloseIconClick={() => {
                setModalMessage(null);
                setIsSubmitted(false); // Reset state
                router.refresh(); // Refresh data before closing
                onClose(); // Close the modal
              }}
              width="500px"
              height="200px">
              {modalMessage}
            </Modal>
          )}
          {modalError && (
            <Modal
              heading="Error"
              enableScreenOverlay={true}
              onCloseIconClick={() => {
                setModalError(null);
                setIsSubmitted(false); // Reset state
                router.refresh(); // Ensure router refreshes
                onClose(); // Close the modal
              }}
              width="500px"
              height="200px">
              {modalError}
            </Modal>
          )}
        </>
      )}
    </>
  );
};
