import { MDXProvider } from '@mdx-js/react';
import { RiInformationLine } from '@remixicon/react';
import dynamic from 'next/dynamic';
import React, { useEffect } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { Skeleton } from '@/app/inputs/groups/[gid]/[group]/[groupId]/[cid]/utils/Skeletion';
import { Modal } from '@/lib/components/modal';
import '@/app/inputs/[gid]/[cid]/components/DecisionTree.css';

// Define a more specific interface for MDX component props
interface DynamicMDXProps {
  data: Record<string, unknown>;
  onChangeData: (key: string, value: unknown) => void;
}

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
      <div className="flex flex-col items-center justify-center py-6">
        <p className="text-white">{message}</p>
      </div>
    </Modal>
  );
};

interface PluginInputModalProps {
  isOpen: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  pluginName: string;
  inputBlockName: string;
  mdxContent: string;
  onSubmit: (data: Record<string, unknown>) => void;
  gid: string;
  cid: string;
  width?: string; // "xs", "sm", "md", "lg", "xl"
  fullScreen?: boolean;
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
  width,
  fullScreen,
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
  };

  const MDXComponent = React.useMemo(() => {
    if (!mdxContent) return null;

    try {
      const context = {
        React,
        _jsx_runtime: ReactJSXRuntime,
      };

      const componentFn = new Function(...Object.keys(context), mdxContent);
      // Use our custom interface for the component props
      const Component = componentFn(
        ...Object.values(context)
      ) as React.ComponentType<DynamicMDXProps>;

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

      // Prepare data to submit
      const dataToSubmit = {
        gid,
        cid,
        group: uniqueGroup,
        name: customName.trim(),
        data: formData,
      };

      // Make POST request to /api/input_block_data
      const response = await fetch('/api/input_block_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        throw new Error('Failed to save input block data');
      }

      const result = await response.json();
      await onSubmit(result);

      // Clear form data after successful submission but don't reset message modal state
      resetForm();

      // Show success message
      setMessageModalProps({
        title: 'Success',
        message: `Input block "${customName}" was successfully created!`,
        type: 'success',
      });
      setShowMessageModal(true);
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
    onClose(false); // false means don't refresh data
  };

  const handleMessageModalClose = () => {
    setShowMessageModal(false);
    if (messageModalProps.type === 'success') {
      // Only close the main modal if it was a success message
      // and pass true to indicate data should be refreshed
      onClose(true);
    }
  };

  // Map width prop to actual width values
  const getModalWidth = () => {
    if (fullScreen) {
      return "100vw";
    }
    
    // Map size to actual width
    switch(width) {
      case 'xs':
        return '20rem'; // 320px
      case 'sm':
        return '30rem'; // 480px
      case 'md':
        return '40rem'; // 640px
      case 'lg':
        return '50rem'; // 800px
      case 'xl':
        return '60rem'; // 960px
      default:
        return '40rem'; // Default to medium size
    }
  };
  console.log("width", getModalWidth());

  // Determine modal height based on fullScreen prop
  const getModalHeight = () => {
    if (fullScreen) {
      return "100vh";
    }
    return 'calc(100% - 100px)';
  };
  console.log("height", getModalHeight());

  if (!isOpen) return null;

  return (
    <>
      {/* Main form modal - only hide when showing success message */}
      {!(showMessageModal && messageModalProps.type === 'success') && (
        <Modal
          heading={`${pluginName} - ${inputBlockName}`}
          enableScreenOverlay={true}
          onCloseIconClick={handleClose}
          onPrimaryBtnClick={handleSubmit}
          onSecondaryBtnClick={handleClose}
          primaryBtnLabel={isLoading ? 'Submitting...' : 'Submit'}
          secondaryBtnLabel="Cancel"
          width={getModalWidth()}
          height={getModalHeight()}
          className={fullScreen ? "fixed inset-0 !translate-x-0 !translate-y-0 !top-0 !left-0 !transform-none rounded-none" : ""}>
          <div className={`flex ${fullScreen ? 'h-full' : 'h-[calc(100%-4rem)]'} flex-col`}>
            {/* Custom name input field with tooltip */}
            <div className="mb-6">
              <div className="mb-2 flex items-center">
                <label
                  htmlFor="custom-name"
                  className="font-medium text-white">
                  Input Block Name
                </label>
                <div className="group relative ml-2">
                  <RiInformationLine className="cursor-help text-gray-400 hover:text-white" />
                  <div className="invisible absolute left-full top-0 z-10 ml-2 w-64 rounded bg-gray-800 p-2 text-xs text-white opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    Give your input block a unique name to identify it by
                  </div>
                </div>
              </div>
              <input
                id="custom-name"
                type="text"
                className="w-full rounded border border-secondary-700 bg-secondary-900 p-3 text-white focus:border-primary-500 focus:outline-none"
                placeholder="Enter a unique name for this input block"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
              />
            </div>

            <MDXProvider>
              <div className="">
                {MDXComponent && (
                  <MDXComponent
                    data={formData}
                    onChangeData={handleChange}
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
