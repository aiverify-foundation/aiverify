import { MDXProvider } from '@mdx-js/react';
import { RiInformationLine, RiCheckLine, RiCloseLine } from '@remixicon/react';
import dynamic from 'next/dynamic';
import React, { useEffect } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { Skeleton } from '@/app/inputs/checklists/[groupId]/[checklistId]/utils/Skeletion';
import type { MDXProps } from '@/app/inputs/checklists/[groupId]/[checklistId]/utils/types';
import { Modal } from '@/lib/components/modal';

// Message Modal Component for Success/Error messages
interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error';
}

const MessageModal = ({ isOpen, onClose, title, message, type }: MessageModalProps) => {
  if (!isOpen) return null;
  
  return (
    <Modal
      heading={title}
      enableScreenOverlay={true}
      onCloseIconClick={onClose}
      onPrimaryBtnClick={onClose}
      primaryBtnLabel="Close"
      width="400px"
      height="auto">
      <div className="flex flex-col items-center justify-center py-6">
        <div className={`rounded-full p-4 mb-4 ${type === 'success' ? 'bg-green-900' : 'bg-red-900'}`}>
          {type === 'success' ? (
            <RiCheckLine className="text-white text-3xl" />
          ) : (
            <RiCloseLine className="text-white text-3xl" />
          )}
        </div>
        <p className="text-center text-white">{message}</p>
      </div>
    </Modal>
  );
};

interface PluginInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  pluginName: string;
  inputBlockName: string;
  mdxContent: string;
  onSubmit: (data: Record<string, unknown>) => void;
  gid: string;
  cid: string;
}

export default function PluginInputModal({
  isOpen,
  onClose,
  pluginName,
  inputBlockName,
  mdxContent,
  onSubmit,
  gid,
  cid,
}: PluginInputModalProps) {
  const [formData, setFormData] = React.useState<Record<string, unknown>>({});
  const [error, setError] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [customName, setCustomName] = React.useState<string>('');
  
  // State for message modal
  const [showMessageModal, setShowMessageModal] = React.useState(false);
  const [messageModalProps, setMessageModalProps] = React.useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    title: '',
    message: '',
    type: 'success',
  });

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      // Reset all form data when modal is closed
      resetForm();
    }
  }, [isOpen]);

  // Function to reset the form to its initial state
  const resetForm = () => {
    setFormData({});
    setCustomName('');
    setError('');
    setShowMessageModal(false);
  };

  const MDXComponent = React.useMemo(() => {
    if (!mdxContent) return null;

    try {
      const context = {
        React,
        _jsx_runtime: ReactJSXRuntime,
      };

      const componentFn = new Function(...Object.keys(context), mdxContent);
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
  }, [mdxContent]);

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    if (!customName.trim()) {
      setError('Please provide a unique name for this input block');
      setIsLoading(false);
      return;
    }

    try {
      // Validate JSON data if present
      if (formData.data) {
        const data =
          typeof formData.data === 'string'
            ? JSON.parse(formData.data as string)
            : formData.data;

        if (!Array.isArray(data)) {
          throw new Error('Data must be an array of objects');
        }

        // Validate each data point
        data.forEach((point, index) => {
          if (!point.x || !point.y) {
            throw new Error(
              `Data point ${index} must have x and y coordinates`
            );
          }
        });
      }

      // Generate a unique group ID using timestamp and random characters
      const uniqueGroup = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      // Make POST request to /api/input_block_data
      const response = await fetch('/api/input_block_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gid,
          cid,
          group: uniqueGroup,
          name: customName.trim(), // Use the custom name instead of inputBlockName
          data: formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save input block data');
      }

      const result = await response.json();
      await onSubmit(result);
      
      // Show success message
      setMessageModalProps({
        title: 'Success',
        message: `Input block "${customName}" was successfully created!`,
        type: 'success',
      });
      setShowMessageModal(true);
      
      // Reset form data after successful submission
      resetForm();
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Invalid form data';
      setError(errorMessage);
      
      // Show error message
      setMessageModalProps({
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
      setShowMessageModal(true);
    } finally {
      setIsLoading(false);
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
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main form modal - hidden when showing success message */}
      {(!showMessageModal || messageModalProps.type === 'error') && (
        <Modal
          heading={`${pluginName} - ${inputBlockName}`}
          enableScreenOverlay={true}
          onCloseIconClick={handleClose}
          onPrimaryBtnClick={handleSubmit}
          onSecondaryBtnClick={handleClose}
          primaryBtnLabel={isLoading ? 'Submitting...' : 'Submit'}
          secondaryBtnLabel="Cancel"
          width={'calc(100% - 200px)'}
          height={'calc(100% - 100px)'}>
          <div className="flex h-[calc(100%-4rem)] flex-col justify-between">
            {/* Custom name input field with tooltip */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <label htmlFor="custom-name" className="text-white font-medium">
                  Input Block Name
                </label>
                <div className="relative ml-2 group">
                  <RiInformationLine className="text-gray-400 hover:text-white cursor-help" />
                  <div className="absolute left-full ml-2 top-0 w-64 bg-gray-800 p-2 rounded shadow-lg text-xs text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    Give your input block a unique name to identify it by
                  </div>
                </div>
              </div>
              <input
                id="custom-name"
                type="text"
                className="w-full p-3 bg-secondary-900 text-white rounded border border-secondary-700 focus:outline-none focus:border-primary-500"
                placeholder="Enter a unique name for this input block"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
              />
            </div>
            
            <MDXProvider>
              <div className="prose prose-invert max-w-none overflow-y-auto">
                {MDXComponent && (
                  <MDXComponent
                    data={formData as Record<string, string>}
                    onChangeData={(key: string, value: string) => {
                      handleChange(key, value);
                    }}
                  />
                )}
              </div>
            </MDXProvider>
            {error && <div className="mt-4 text-sm text-red-500">{error}</div>}
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
}
