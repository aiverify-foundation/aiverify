'use client';

import { RiInformationLine } from '@remixicon/react';
import { getMDXComponent } from 'mdx-bundler/client';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo, useEffect } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { useMDXBundle } from '@/app/inputs/hooks/useMDXBundle';
import { useMDXSummaryBundle } from '@/app/inputs/hooks/useMDXSummaryBundle';
import { useSubmitInputBlockData } from '@/app/inputs/hooks/useSubmitInputBlockData';
import { InputBlockDataPayload } from '@/app/types';
import { Modal } from '@/lib/components/modal';

// Message Modal Component for Success/Error messages
interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error';
}

const MessageModal = ({
  isOpen,
  onClose,
  title,
  message,
}: MessageModalProps) => {
  if (!isOpen) return null;

  return (
    <Modal
      heading={title}
      enableScreenOverlay={true}
      onCloseIconClick={onClose}
      width="500px"
      height="200px">
      <p className="text-white">{message}</p>
    </Modal>
  );
};

interface DynamicInputBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  gid: string;
  cid: string;
  title: string;
}

export const DynamicInputBlockModal: React.FC<DynamicInputBlockModalProps> = ({
  isOpen,
  onClose,
  gid,
  cid,
  title,
}) => {
  const { data: mdxBundle, isLoading, error } = useMDXBundle(gid, cid);
  const {
    data: mdxSummaryBundle,
    isLoading: summaryLoading,
    error: summaryError,
  } = useMDXSummaryBundle(gid, cid);

  const { submitInputBlockData, isSubmitting } = useSubmitInputBlockData();
  const router = useRouter();

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [customName, setCustomName] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [validationProgress, setValidationProgress] = useState<number>(0);

  // State for message modal
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModalProps, setMessageModalProps] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    title: '',
    message: '',
    type: 'success',
  });

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

  // Update progress whenever form data changes
  useEffect(() => {
    if (validationFunctions?.progress) {
      try {
        const progress = validationFunctions.progress(formData);
        setValidationProgress(progress || 0);
      } catch (error) {
        console.error('Error calculating progress:', error);
        setValidationProgress(0);
      }
    }
  }, [formData, validationFunctions]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Function to reset the form to its initial state
  const resetForm = () => {
    setFormData({});
    setCustomName('');
    setFormError('');
    setShowMessageModal(false);
    setValidationProgress(0);
  };

  const Component = useMemo(() => {
    if (!mdxBundle) {
      const MissingMdxMessage = () => (
        <div>{`Missing input block content`}</div>
      );
      MissingMdxMessage.displayName = 'MissingMdxMessage';
      return MissingMdxMessage;
    }
    return getMDXComponent(mdxBundle.code);
  }, [mdxBundle]);

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFormError('');
  };

  const validateForm = (): boolean => {
    // Check if name is provided
    if (!customName.trim()) {
      setFormError('Please provide a unique name for this input block');
      return false;
    }

    // Use validation function from summary bundle if available
    if (validationFunctions?.validate) {
      try {
        const isValid = validationFunctions.validate(formData);
        if (!isValid) {
          setFormError('Please complete all required fields before submitting');
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

    try {
      // Generate a unique group ID using timestamp and random characters
      const uniqueGroup = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      const inputBlockData = {
        gid,
        cid,
        name: customName.trim(),
        group: uniqueGroup,
        data: formData as InputBlockDataPayload,
      };

      await submitInputBlockData(inputBlockData);

      // Show success message
      setMessageModalProps({
        title: 'Success',
        message: `Input block "${customName}" was successfully created!`,
        type: 'success',
      });
      setShowMessageModal(true);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'Failed to submit input block data';

      // Show error message
      setMessageModalProps({
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
      setShowMessageModal(true);
    }
  };

  // Custom close handler that wraps the parent onClose and resets the form
  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleMessageModalClose = () => {
    setShowMessageModal(false);
    if (messageModalProps.type === 'success') {
      // Only close the main modal if it was a success message
      onClose();
      router.push(`/inputs/${gid}/${cid}`);
    }
  };

  if (!isOpen) return null;

  if (isLoading || summaryLoading) {
    return (
      <Modal
        heading={`Loading ${title}`}
        enableScreenOverlay={true}
        onCloseIconClick={handleClose}
        width={'calc(100% - 200px)'}
        height={'calc(100% - 100px)'}>
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
        <div className="flex flex-col py-6">
          <p className="text-white">
            Error loading content: {(error || summaryError)?.message}
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <>
      {/* Main form modal - hidden when showing success message */}
      {(!showMessageModal || messageModalProps.type === 'error') && (
        <Modal
          heading={`${title}`}
          enableScreenOverlay={true}
          onCloseIconClick={handleClose}
          onPrimaryBtnClick={handleSubmit}
          onSecondaryBtnClick={handleClose}
          primaryBtnLabel={isSubmitting ? 'Submitting...' : 'Submit'}
          secondaryBtnLabel="Cancel"
          width={'calc(100% - 200px)'}
          height={'calc(100% - 50px)'}>
          <div className="flex h-[calc(100%-4rem)] flex-col">
            {/* Form header section with name input and progress bar side by side */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-6">
              {/* Custom name input field with tooltip */}
              <div className="align-start mb-4 sm:mb-0 sm:max-w-[70%] sm:flex-grow">
                <div className="mb-2 flex items-center">
                  <label
                    htmlFor="custom-name"
                    className="font-small text-white">
                    Input Block Name
                  </label>
                  <div className="group relative ml-2">
                    <RiInformationLine
                      className="text-gray-400"
                      size={16}
                      style={{ cursor: 'help' }}
                    />
                    <div className="invisible absolute left-full top-0 z-10 ml-2 w-64 rounded bg-gray-800 p-2 text-xs text-white opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      Give your input block a unique name to identify it by
                    </div>
                  </div>
                </div>
                <input
                  id="custom-name"
                  type="text"
                  className="h-[30px] w-full rounded border border-secondary-700 bg-secondary-900 p-3 text-white focus:border-primary-500 focus:outline-none"
                  placeholder="Enter a unique name for this input block"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                />
              </div>

              {/* Completion Progress - Compact Display */}
              {validationFunctions?.progress && (
                <div className="align-start flex flex-col items-end gap-2 sm:ml-auto sm:flex-shrink-0">
                  <div className="w-full text-right text-sm font-medium text-white">
                    Completion: {validationProgress}%
                  </div>
                  <div className="h-2 w-[200px] overflow-hidden rounded-full bg-secondary-700">
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

            {/* Main form content area */}
            <div className="flex-1 overflow-y-auto scrollbar-hidden">
              {mdxBundle && (
                <Component
                  isEditing={true}
                  data={formData}
                  onChangeData={handleChange}
                />
              )}
            </div>

            {/* Error message at the bottom */}
            {formError && (
              <div className="mt-4 text-sm text-red-500">{formError}</div>
            )}
          </div>
        </Modal>
      )}

      {/* Message modal - shown conditionally */}
      {showMessageModal && (
        <MessageModal
          isOpen={showMessageModal}
          onClose={handleMessageModalClose}
          title={messageModalProps.title}
          message={messageModalProps.message}
          type={messageModalProps.type}
        />
      )}
    </>
  );
};
