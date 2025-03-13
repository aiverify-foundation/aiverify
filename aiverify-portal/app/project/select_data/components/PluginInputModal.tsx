import { MDXProvider } from '@mdx-js/react';
import dynamic from 'next/dynamic';
import React from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import { Skeleton } from '@/app/inputs/checklists/[groupId]/[checklistId]/utils/Skeletion';
import type { MDXProps } from '@/app/inputs/checklists/[groupId]/[checklistId]/utils/types';
import { Modal } from '@/lib/components/modal';

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

      // Make POST request to /api/input_block_data
      const response = await fetch('/api/input_block_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gid,
          cid,
          data: formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save input block data');
      }

      const result = await response.json();
      await onSubmit(result);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid form data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      heading={`${pluginName} - ${inputBlockName}`}
      enableScreenOverlay={true}
      onCloseIconClick={onClose}
      onPrimaryBtnClick={handleSubmit}
      onSecondaryBtnClick={onClose}
      primaryBtnLabel={isLoading ? 'Submitting...' : 'Submit'}
      secondaryBtnLabel="Cancel"
      width={'calc(100% - 200px)'}
      height={'calc(100% - 100px)'}>
      <div className="flex h-[calc(100%-4rem)] flex-col justify-between">
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
  );
}
