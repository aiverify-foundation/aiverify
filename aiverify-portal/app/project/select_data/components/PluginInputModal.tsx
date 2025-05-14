import { MDXProvider } from '@mdx-js/react';
import { RiInformationLine } from '@remixicon/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo } from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { QueryProvider } from '@/app/inputs/[gid]/[cid]/components/QueryProvider';
import { Tooltip } from '@/app/inputs/[gid]/[cid]/components/Tooltip';
import { FairnessTreeProvider } from '@/app/inputs/[gid]/[cid]/context/FairnessTreeContext';
import { Skeleton } from '@/app/inputs/groups/[gid]/[group]/[groupId]/[cid]/utils/Skeletion';
import { Modal } from '@/lib/components/modal';
import '@/app/inputs/[gid]/[cid]/components/DecisionTree.css';

// Define a more specific interface for MDX component props
interface DynamicMDXProps {
  data: Record<string, unknown>;
  onChangeData: (key: string, value: unknown) => void;
  isEditing?: boolean;
  graphdata?: Record<string, unknown>;
  definitions?: Record<string, unknown>;
  frontmatter?: Record<string, unknown>;
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
  frontmatter?: Record<string, unknown>; // Add frontmatter from MDX bundle
}

// Universal initial data structure that works for all component types
const createUniversalInitialData = () => ({
  // Common fields that might be used by any component
  name: '',
  description: '',
  
  // Fields used by fairness trees and other complex components
  sensitiveFeature: '',
  favourableOutcomeName: '',
  qualified: '',
  unqualified: '',
  
  // Arrays that might be needed by any component
  data: [],
  metrics: [],
  selectedOutcomes: [],
  
  // Nested structures that might be needed
  selections: {
    nodes: [],
    edges: [],
  },
  
  // Other potential fields with safe default values
  options: {},
  config: {},
  parameters: {},
});

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
  frontmatter,
}: PluginInputModalProps) {
  // Create a universal initial data structure that works for all component types
  const initialFormData = useMemo(() => createUniversalInitialData(), []);
  
  const [formData, setFormData] = React.useState<Record<string, unknown>>(initialFormData);
  const [error, setError] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [customName, setCustomName] = React.useState<string>('');
  const [validationProgress, setValidationProgress] = React.useState<number>(0);
  const [isSubmitted, setIsSubmitted] = React.useState<boolean>(false);
  const router = useRouter();

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
    setFormData(initialFormData);
    setCustomName('');
    setError('');
    setValidationProgress(0);
    setIsSubmitted(false);
  };

  // Extract validation and summary functions if they exist in the MDX content
  const extractedFunctions = useMemo(() => {
    if (!mdxContent) return null;

    try {
      const context = {
        React,
        jsx: ReactJSXRuntime.jsx,
        jsxs: ReactJSXRuntime.jsxs,
        _jsx_runtime: ReactJSXRuntime,
        Fragment: ReactJSXRuntime.Fragment,
      };

      const componentFn = new Function(...Object.keys(context), mdxContent);
      const moduleExports = componentFn(...Object.values(context));

      return {
        validate: typeof moduleExports.validate === 'function' ? moduleExports.validate : null,
        progress: typeof moduleExports.progress === 'function' ? moduleExports.progress : null,
        summary: typeof moduleExports.summary === 'function' ? moduleExports.summary : null,
      };
    } catch (error) {
      console.error('Error extracting functions from MDX:', error);
      return null;
    }
  }, [mdxContent]);

  // Update progress whenever form data changes
  useEffect(() => {
    if (extractedFunctions?.progress) {
      try {
        const progress = extractedFunctions.progress(formData);
        setValidationProgress(progress || 0);
      } catch (error) {
        console.error('Error calculating progress:', error);
        setValidationProgress(0);
      }
    }
  }, [formData, extractedFunctions]);

  const MDXComponent = React.useMemo(() => {
    if (!mdxContent) return null;

    try {
      const context = {
        React,
        jsx: ReactJSXRuntime.jsx,
        jsxs: ReactJSXRuntime.jsxs,
        _jsx_runtime: ReactJSXRuntime,
        Fragment: ReactJSXRuntime.Fragment,
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
    setFormData((prev) => {
      // Handle nested properties (e.g., 'selections.nodes')
      if (name.includes('.')) {
        const parts = name.split('.');
        const topLevelProp = parts[0];
        const nestedProp = parts[1];
        
        // Ensure the top-level property exists and is an object
        const topLevelObj = prev[topLevelProp] || {};
        
        // Create a new object with the nested property updated
        const updatedObj = { 
          ...topLevelObj, 
          [nestedProp]: value 
        };
        
        return { ...prev, [topLevelProp]: updatedObj };
      }
      
      // Handle regular properties
      return { ...prev, [name]: value };
    });
    
    setError('');
  };

  const validateForm = (): boolean => {
    // Check if name is provided
    if (!customName.trim()) {
      setError('Please provide a unique name for this input block');
      return false;
    }

    // Use validation function if available
    if (extractedFunctions?.validate) {
      try {
        const isValid = extractedFunctions.validate(formData);
        if (!isValid) {
          setError('Please fill in all required fields before submitting.');
          return false;
        }
      } catch (error) {
        console.error('Validation error:', error);
        setError('Error validating form data. Please check your inputs.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    // Validate form
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
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
      setIsSubmitted(true);
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
      setIsSubmitted(true);
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
      router.refresh();
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
        return '90%'; // Default to 90% like FairnessTreeUploadModal
    }
  };

  // Determine modal height based on fullScreen prop
  const getModalHeight = () => {
    if (fullScreen) {
      return "100vh";
    }
    return 'calc(100% - 50px)'; // Match FairnessTreeUploadModal height
  };

  if (!isOpen) return null;

  // If we're in the submitted state, show the appropriate message modal
  if (isSubmitted) {
    return (
      <>
        {messageModalProps.type === 'success' && (
          <Modal
            heading="Success"
            enableScreenOverlay={true}
            onCloseIconClick={() => {
              setShowMessageModal(false);
              setIsSubmitted(false);
              router.refresh();
              onClose(true);
            }}
            width="500px"
            height="200px">
            {messageModalProps.message}
          </Modal>
        )}
        {messageModalProps.type === 'error' && (
          <Modal
            heading="Error"
            enableScreenOverlay={true}
            onCloseIconClick={() => {
              setShowMessageModal(false);
              setIsSubmitted(false);
            }}
            width="500px"
            height="200px">
            {messageModalProps.message}
          </Modal>
        )}
      </>
    );
  }

  // For loading state
  if (isLoading && !MDXComponent) {
    return (
      <Modal
        heading={`Loading ${inputBlockName}`}
        enableScreenOverlay={true}
        onCloseIconClick={handleClose}
        width={getModalWidth()}
        height={getModalHeight()}>
        <div className="flex h-64 items-center justify-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-white" />
          <p className="ml-3 text-lg text-white">Loading content...</p>
        </div>
      </Modal>
    );
  }

  return (
    <>
      {/* Main form modal */}
      <QueryProvider>
        <FairnessTreeProvider>
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
                      <Tooltip content="Enter a unique name for this input block">
                        <RiInformationLine className="h-5 w-5 text-gray-400 hover:text-gray-200" />
                      </Tooltip>
                    </div>

                    {/* Input Field */}
                    <input
                      id="name"
                      value={customName}
                      required
                      onChange={(e) => {
                        setCustomName(e.target.value);
                        setError('');
                      }}
                      className="h-[20px] flex-grow rounded border border-secondary-700 bg-secondary-900 p-3 text-white focus:border-primary-500 focus:outline-none"
                      placeholder="Enter a unique name for this input block"
                    />
                  </div>
                </div>

                {/* Completion Progress - Show if available */}
                {extractedFunctions?.progress && (
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
              {error && (
                <div className="mb-4 text-sm text-red-500">{error}</div>
              )}

              {/* Main form content area */}
              <div className="decision-tree-container h-[calc(100%-50px)] flex-1 overflow-y-auto">
                <MDXProvider>
                  {MDXComponent && (
                    <MDXComponent
                      data={formData}
                      onChangeData={handleChange}
                      isEditing={true}
                      graphdata={frontmatter?.graphdata as Record<string, unknown> | undefined}
                      definitions={frontmatter?.definitions as Record<string, unknown> | undefined}
                      frontmatter={frontmatter}
                    />
                  )}
                </MDXProvider>
              </div>
            </div>
          </Modal>
        </FairnessTreeProvider>
      </QueryProvider>

      {/* Message modal - shown conditionally */}
      {showMessageModal && !isSubmitted && (
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
