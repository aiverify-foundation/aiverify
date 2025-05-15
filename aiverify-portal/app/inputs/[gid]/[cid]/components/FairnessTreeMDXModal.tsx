'use client';

import { getMDXComponent } from 'mdx-bundler/client';
import React, { useMemo, useState } from 'react';
import { useDeleteFairnessTree } from '@/app/inputs/[gid]/[cid]/hooks/useDeleteFairnessTree';
import { useFairnessTreeEdit } from '@/app/inputs/[gid]/[cid]/hooks/useEditFairnessTree';
import { useMDXBundle } from '@/app/inputs/[gid]/[cid]/hooks/useMDXBundle';
import { InfoIcon } from '@/app/inputs/groups/[gid]/[group]/upload/utils/icons';
import { FairnessTree } from '@/app/inputs/utils/types';
import { Modal } from '@/lib/components/modal';
import './DecisionTree.css';
import { Tooltip } from './Tooltip';

const FairnessTreeMDXModal: React.FC<{
  tree: FairnessTree;
  isOpen: boolean;
  onClose: () => void;
}> = ({ tree, onClose }) => {
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const {
    isEditing,
    setIsEditing,
    treeName,
    setTreeName,
    treeData,
    handleChangeData,
    handleSaveChanges,
  } = useFairnessTreeEdit({ tree, onClose });

  const { mutate: deleteTree } = useDeleteFairnessTree(
    () => {
      setModalMessage('Tree deleted successfully');
      setIsSubmitted(true); // Switch to the success/error modal
    },
    (error) => {
      setModalError(`Error deleting tree: ${error.message}`);
      setIsSubmitted(true); // Switch to the success/error modal
    }
  );

  const handleDelete = () => {
    if (tree.id) {
      deleteTree(tree.id);
    }
  };

  const handleSave = async () => {
    const result = await handleSaveChanges();
    if (result.success) {
      setModalMessage(result.message);
    } else {
      setModalError(result.message);
    }
    setIsSubmitted(true); // Switch to the success/error modal
  };

  const {
    data: mdxBundle,
    isLoading,
    error,
  } = useMDXBundle(tree.gid, tree.cid);

  const Component = useMemo(() => {
    if (!mdxBundle) {
      const MissingMdxMessage = () => (
        <div>{`${tree.name} - ${tree.cid} : Missing mdx`}</div>
      );
      MissingMdxMessage.displayName = 'MissingMdxMessage';
      return MissingMdxMessage;
    }
    return getMDXComponent(mdxBundle.code);
  }, [mdxBundle]);

  if (isLoading) {
    return <div className="text-sm text-gray-400">Loading...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-400">Error loading content</div>;
  }

  if (!Component) {
    return <div className="text-sm text-gray-400">No content available</div>;
  }

  return (
    <>
      {!isSubmitted ? (
        <Modal
          heading={isEditing ? 'Edit Tree' : tree.name}
          enableScreenOverlay={true}
          onCloseIconClick={onClose}
          onPrimaryBtnClick={isEditing ? handleSave : () => setIsEditing(true)}
          onSecondaryBtnClick={handleDelete}
          primaryBtnLabel={isEditing ? 'Save Changes' : 'Edit Tree'}
          secondaryBtnLabel="Delete Tree"
          width={'90%'}
          height={'calc(100vh - 100px)'}>
          <div className="decision-tree-container">
            {isEditing && (
              <div className="flex items-center gap-4">
                <label
                  htmlFor="name"
                  className="flex items-center text-left">
                  Name
                  <Tooltip content="Enter a unique name for the fairness tree">
                    <InfoIcon className="ml-2 h-5 w-5 text-gray-400 hover:text-gray-200" />
                  </Tooltip>
                </label>
                <input
                  type="text"
                  value={treeName}
                  required
                  onChange={(e) => setTreeName(e.target.value)}
                  className="col-span-1 rounded border border-gray-300 text-black"
                  placeholder="Enter tree name"
                />
              </div>
            )}
            <Component
              data={treeData}
              onChangeData={handleChangeData}
              isEditing={isEditing} // Pass isEditing prop
            />
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
                onClose(); // Close the modal
              }}>
              <div className="text-green-500">{modalMessage}</div>
            </Modal>
          )}
          {modalError && (
            <Modal
              heading="Error"
              enableScreenOverlay={true}
              onCloseIconClick={() => {
                setModalError(null);
                setIsSubmitted(false); // Reset state
              }}>
              <div className="text-red-500">{modalError}</div>
            </Modal>
          )}
        </>
      )}
    </>
  );
};

export default FairnessTreeMDXModal;
