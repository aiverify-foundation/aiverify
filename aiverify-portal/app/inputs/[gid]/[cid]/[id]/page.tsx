'use client';

import { getMDXComponent } from 'mdx-bundler/client';
import Link from 'next/link';
import React, { useEffect, useState, useMemo } from 'react';
import { useMDXBundle } from '@/app/inputs/hooks/useMDXBundle';
import { useUpdateInputBlockData } from '@/app/inputs/hooks/useUpdateInputBlockData';
import { InputBlockData, InputBlockDataPayload } from '@/app/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Modal } from '@/lib/components/modal';

// Message Modal for success/error notifications
interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error';
}

const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      heading={title}
      enableScreenOverlay={true}
      onCloseIconClick={onClose}
      width="400px"
      height="200px">
      <p className="text-white">{message}</p>
    </Modal>
  );
};

interface PageParams {
  gid: string;
  cid: string;
  id: string;
}

export default function DynamicInputBlockDetail({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = React.use(params);
  // Destructure the resolved params
  const { gid, cid, id } = resolvedParams;

  const [inputData, setInputData] = useState<InputBlockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<InputBlockDataPayload>({});
  const [showModal, setShowModal] = useState(false);
  const [modalProps, setModalProps] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    title: '',
    message: '',
    type: 'success',
  });

  const {
    data: mdxBundle,
    isLoading: mdxLoading,
    error: mdxError,
  } = useMDXBundle(gid, cid);

  const {
    updateInputBlockData,
    isUpdating,
    error: updateError,
    isSuccess,
  } = useUpdateInputBlockData();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/input_block_data/${id}`);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch input block data: ${response.statusText}`
          );
        }

        const data = await response.json();
        setInputData(data);
        // Ensure we use the correct type
        setEditedData(data.data || {});
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (updateError) {
      setModalProps({
        title: 'Error',
        message: updateError.message,
        type: 'error',
      });
      setShowModal(true);
    }
  }, [updateError]);

  useEffect(() => {
    if (isSuccess) {
      setModalProps({
        title: 'Success',
        message: 'Input block data updated successfully',
        type: 'success',
      });
      setShowModal(true);
      setIsEditing(false);
    }
  }, [isSuccess]);

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

  // Handle changes to form fields with proper typing
  const handleDataChange = (
    key: string,
    value: InputBlockDataPayload[string]
  ) => {
    setEditedData((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (inputData) {
      setEditedData(inputData.data || {});
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!inputData) return;

    try {
      await updateInputBlockData({
        id,
        data: {
          ...inputData,
          data: editedData,
        },
      });

      // Update local state
      setInputData({
        ...inputData,
        data: editedData,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || mdxLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
          <p className="text-lg text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || mdxError) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-900 p-4 text-white">
          <h2 className="text-xl font-bold">Error</h2>
          <p>{error || mdxError?.message}</p>
          <div className="mt-4">
            <Link
              href="/inputs"
              className="rounded bg-primary-700 px-4 py-2 text-white hover:bg-primary-600">
              Return to Inputs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!inputData) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-secondary-900 p-4 text-white">
          <h2 className="text-xl font-bold">Input Block Data Not Found</h2>
          <p>The requested input block data could not be found.</p>
          <div className="mt-4">
            <Link
              href="/inputs"
              className="rounded bg-primary-700 px-4 py-2 text-white hover:bg-primary-600">
              Return to Inputs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/inputs/${gid}/${cid}`}>
            <Icon
              name={IconName.ArrowLeft}
              size={40}
              color="#FFFFFF"
            />
          </Link>
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-white">{inputData.name}</h1>
            <div className="flex space-x-3 text-sm text-secondary-400">
              <span>
                Created: {new Date(inputData.created_at + "Z").toLocaleDateString()}
              </span>
              <span>
                Last Updated:{' '}
                {new Date(inputData.updated_at + "Z").toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 rounded bg-primary-700 px-4 py-2 text-white hover:bg-primary-600">
              <Icon
                name={IconName.Pencil}
                size={20}
                color="white"
              />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="rounded border border-secondary-400 px-4 py-2 text-white hover:bg-secondary-800">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="flex items-center gap-2 rounded bg-primary-700 px-4 py-2 text-white hover:bg-primary-600 disabled:opacity-50">
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-secondary-950 p-6 shadow-lg">
        {mdxBundle && (
          <div className="input-block-detail">
            <Component
              data={isEditing ? editedData : inputData.data}
              isEditing={isEditing}
              onChangeData={isEditing ? handleDataChange : undefined}
            />
          </div>
        )}
      </div>

      <MessageModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalProps.title}
        message={modalProps.message}
        type={modalProps.type}
      />
    </div>
  );
}
