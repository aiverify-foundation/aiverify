// FairnessTreeUploadModal.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useMDXBundle } from '../hooks/useMDXBundle';
import { useFairnessTree } from '../context/FairnessTreeContext';
import { useSubmitFairnessTree } from '../hooks/useSubmitFairnessTree';
import { Modal } from '@/lib/components/modal';
import { getMDXComponent } from 'mdx-bundler/client';
import './DecisionTree.css';
import { InfoIcon } from '../../checklists/upload/utils/icons';
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

  const Component = useMemo(() => {
    if (!mdxBundle) {
      const MissingMdxMessage = () => <div>{`Missing mdx`}</div>;
      MissingMdxMessage.displayName = 'MissingMdxMessage';
      return MissingMdxMessage;
    }
    return getMDXComponent(mdxBundle.code);
  }, [mdxBundle]);

  const { addFairnessTree } = useFairnessTree();
  const { submitFairnessTree, isSubmitting, submitError } =
    useSubmitFairnessTree();

  const [name, setName] = useState<string>('');
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [treeData, setTreeData] = useState<Record<string, any>>({
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

  const handleSubmit = async () => {
    if (!name) {
      setShowWarning(true);
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
        gid: 'aiverify.stock.fairness_metrics_toolbox_for_classification',
        name,
        group: name,
        data: treeData,
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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading MDX bundle: {error.message}</div>;

  return (
    <>
      {!isSubmitted ? (
        <Modal
          heading="Add Fairness Tree"
          enableScreenOverlay={true}
          onCloseIconClick={handleClose}
          onPrimaryBtnClick={handleSubmit}
          primaryBtnLabel="SUBMIT"
          width={'90%'}
          height={'calc(100vh - 100px)'}>
          <div>
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
                id="name"
                value={name}
                required
                onChange={(e) => {
                  setName(e.target.value);
                  setShowWarning(false);
                }}
                className="col-span-1 rounded border border-gray-300 text-black"
              />
            </div>
            {showWarning && (
              <p className="text-sm text-red-500">
                Please enter a name before submitting.
              </p>
            )}
          </div>
          {mdxBundle && (
            <div className="decision-tree-container overflow-y-auto">
              <Component
                graphdata={mdxBundle.frontmatter.graphdata}
                definitions={mdxBundle.frontmatter.definitions}
                isEditing={true} // Always in edit mode for new trees
                data={treeData}
                onChangeData={(key: string, value: string) =>
                  setTreeData((prev) => ({ ...prev, [key]: value }))
                }
              />
            </div>
          )}
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
