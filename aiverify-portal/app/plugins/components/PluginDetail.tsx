'use client';

import React, { useState, useEffect } from 'react';
import { useDeletePlugin } from '@/app/plugins/hooks/useDeletePlugin';
import { DeleteIcon } from '@/app/plugins/utils/icons';
import { Plugin } from '@/app/plugins/utils/types';
import { Modal } from '@/lib/components/modal';
import AlgorithmCard from './DisplayAlgorithm';
import InputBlockCard from './DisplayInputBlocks';
import TemplateCard from './DisplayTemplate';
import WidgetCard from './DisplayWidget';

type Props = {
  plugin: Plugin | null;
  onDelete: (deletedPluginGid: string) => void;
};

export default function PluginDetail({ plugin, onDelete }: Props) {
  const [activeTab, setActiveTab] = useState<
    'widgets' | 'algorithms' | 'input_blocks' | 'templates' | null
  >(null);
  const [currentPlugin, setCurrentPlugin] = useState<Plugin | null>(plugin);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [] = useState(false);
  const [, setConfirmDeleteGid] = useState<string | null>(null);
  const [isConfirmation, setIsConfirmation] = useState(true);

  useEffect(() => {
    setCurrentPlugin(plugin);

    // Automatically select the first available tab
    if (plugin) {
      if (plugin.widgets?.length > 0) {
        setActiveTab('widgets');
      } else if (plugin.algorithms?.length > 0) {
        setActiveTab('algorithms');
      } else if (plugin.input_blocks?.length > 0) {
        setActiveTab('input_blocks');
      } else if (plugin.templates?.length > 0) {
        setActiveTab('templates');
      } else {
        setActiveTab(null);
      }
    }
  }, [plugin]);

  const handleDelete = async (gid: string) => {
    setConfirmDeleteGid(gid);
    setIsModalVisible(true); // Show the modal first
    setModalMessage('Are you sure you want to delete this plugin?'); // Confirmation message
  };

  const deletePluginMutation = useDeletePlugin();

  const confirmDelete = async () => {
    if (!currentPlugin) return; // Ensure there is a plugin selected

    try {
      // Show confirmation modal,
      setIsConfirmation(false); // Switch the modal to message mode
      const message = await deletePluginMutation.mutateAsync(currentPlugin.gid);
      setModalMessage(message);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Failed to delete plugin:', error);
      setModalMessage('Failed to delete the plugin.');
    }
  };

  if (!currentPlugin) {
    return (
      <div className="mt-20 text-center text-white">
        <p>Select a plugin to see details here.</p>
      </div>
    );
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-lg bg-secondary-950 p-6 text-white shadow-lg"
      role="region"
      aria-label={`Details for ${currentPlugin.name} plugin`}>
      {/* Delete Confirmation Popup */}
      {isModalVisible && isConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-labelledby="confirm-deletion-heading"
          aria-describedby="confirm-deletion-description">
          <Modal
            bgColor="var(--color-primary-500)"
            textColor="white"
            onCloseIconClick={() => setIsModalVisible(false)}
            enableScreenOverlay
            heading="Confirm Deletion"
            height={200}
            primaryBtnLabel="DELETE"
            secondaryBtnLabel="CANCEL"
            onPrimaryBtnClick={confirmDelete} // Handle actual deletion
            onSecondaryBtnClick={() => setIsModalVisible(false)} // Close the modal
          >
            <p id="delete-confirmation-message">
              Are you sure you want to delete this plugin?
            </p>
          </Modal>
        </div>
      )}

      {/* Delete Result Message Popup */}
      {isModalVisible && !isConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-labelledby="delete-result-heading"
          aria-describedby="delete-result-description">
          <Modal
            bgColor="var(--color-primary-500)"
            textColor="white"
            onCloseIconClick={() => {
              setIsModalVisible(false); // Close modal
              if (modalMessage === 'Plugin deleted successfully!') {
                // Notify parent component to update the UI after modal is closed
                onDelete(currentPlugin.gid);
              }
            }}
            enableScreenOverlay
            heading={
              modalMessage === 'Plugin deleted successfully!'
                ? 'Success'
                : 'Error'
            }
            height={200}>
            <p id="delete-result-description">{modalMessage}</p>
          </Modal>
        </div>
      )}
      {/* Metadata of Plugin */}
      <div
        className="mb-4 pb-4"
        role="group"
        aria-labelledby="plugin-metadata-heading">
        <div className="flex items-center justify-between">
          <h3
            className="mb-2 text-2xl font-semibold"
            id="plugin-metadata-heading">
            {currentPlugin.name}
          </h3>
          <DeleteIcon
            onClick={() => handleDelete(currentPlugin.gid)}
            aria-label="Delete plugin"
            role="button"
          />
        </div>
        <div
          className="space-y-1 text-base"
          role="group"
          aria-label="Plugin metadata">
          <p aria-label={`description ${currentPlugin.description}`}>
            {currentPlugin.description}
          </p>
          <p />
          <p>
            <span
              className="font-semibold"
              aria-label={`GID ${currentPlugin.gid}`}>
              GID:
            </span>{' '}
            {currentPlugin.gid}
          </p>
          <p>
            <span
              className="font-semibold"
              aria-label={`Version ${currentPlugin.version}`}>
              Version:
            </span>{' '}
            {currentPlugin.version}
          </p>
          <p>
            <span
              className="font-semibold"
              aria-label={`Author ${currentPlugin.author}`}>
              Author:
            </span>{' '}
            {currentPlugin.author}
          </p>
          <p>
            <span
              className="font-semibold"
              aria-label={`Installed date ${new Date(currentPlugin.updated_at + "Z").toLocaleString('en-GB')}`}>
              Installed on:
            </span>{' '}
            {new Date(currentPlugin.updated_at + "Z").toLocaleString('en-GB')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      {(currentPlugin.widgets?.length > 0 ||
        currentPlugin.algorithms?.length > 0) && (
        <div
          className="mb-4 flex justify-start space-x-1 border-b border-gray-700"
          role="tablist"
          aria-label="Plugin content tabs">
          {currentPlugin.widgets?.length > 0 && (
            <button
              className={`rounded-t px-6 py-2 ${
                activeTab === 'widgets'
                  ? 'border-b-4 border-primary-500 bg-secondary-200 font-semibold text-secondary-950'
                  : 'bg-secondary-300 text-secondary-950'
              }`}
              onClick={() => setActiveTab('widgets')}
              role="tab"
              aria-selected={activeTab === 'widgets'}
              aria-controls="widgets-tabpanel"
              id="widgets-tab">
              Widgets
              <span
                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-center text-sm text-white"
                role="status"
                aria-label={`Widgets count: ${currentPlugin.widgets.length}`}>
                {currentPlugin.widgets.length}
              </span>
            </button>
          )}
          {currentPlugin.algorithms?.length > 0 && (
            <button
              className={`rounded-t px-6 py-2 ${
                activeTab === 'algorithms'
                  ? 'border-b-4 border-primary-500 bg-secondary-200 font-semibold text-secondary-950'
                  : 'bg-secondary-300 text-secondary-950'
              }`}
              onClick={() => setActiveTab('algorithms')}
              role="tab"
              aria-selected={activeTab === 'algorithms'}
              aria-controls="algorithms-tabpanel"
              id="algorithms-tab">
              Algorithms
              <span
                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-center text-sm text-white"
                role="status"
                aria-label={`algorithms count: ${currentPlugin.algorithms.length}`}>
                {currentPlugin.algorithms.length}
              </span>
            </button>
          )}
          {currentPlugin.input_blocks?.length > 0 && (
            <button
              className={`rounded-t px-6 py-2 ${
                activeTab === 'input_blocks'
                  ? 'border-b-4 border-primary-500 bg-secondary-200 font-semibold text-secondary-950'
                  : 'bg-secondary-300 text-secondary-950'
              }`}
              onClick={() => setActiveTab('input_blocks')}
              role="tab"
              aria-selected={activeTab === 'input_blocks'}
              aria-controls="input-blocks-tabpanel"
              id="input-blocks-tab">
              Input Blocks
              <span
                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-center text-sm text-white"
                role="status"
                aria-label={`input blocks count: ${currentPlugin.input_blocks.length}`}>
                {currentPlugin.input_blocks.length}
              </span>
            </button>
          )}
          {currentPlugin.templates?.length > 0 && (
            <button
              className={`rounded-t px-6 py-2 ${
                activeTab === 'templates'
                  ? 'border-b-4 border-primary-500 bg-secondary-200 font-semibold text-secondary-950'
                  : 'bg-secondary-300 text-secondary-950'
              }`}
              onClick={() => setActiveTab('templates')}
              role="tab"
              aria-selected={activeTab === 'templates'}
              aria-controls="templates-tabpanel"
              id="templates-tab">
              Templates
              <span
                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-center text-sm text-white"
                role="status"
                aria-label={`templates count: ${currentPlugin.templates.length}`}>
                {currentPlugin.templates.length}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Tab Content */}
      <div
        className="flex-1 overflow-y-auto p-1 scrollbar-hidden"
        role="tabpanel"
        aria-labelledby={`${activeTab}-tab`}
        id={`${activeTab}-tabpanel`}>
        <div>
          {activeTab === 'widgets' && (
            <div>
              <div className="space-y-4">
                {currentPlugin.widgets.map((widget) => (
                  <div key={`${widget.gid}:${widget.cid}`}>
                    <WidgetCard widget={widget} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'algorithms' && (
            <div className="space-y-4">
              {currentPlugin.algorithms.map((algorithm) => (
                <div key={`${algorithm.gid}:${algorithm.cid}`}>
                  <AlgorithmCard algorithm={algorithm} />
                </div>
              ))}
            </div>
          )}
          {activeTab === 'input_blocks' && (
            <div className="space-y-4">
              {currentPlugin.input_blocks.map((input_block) => (
                <div key={`${input_block.gid}:${input_block.cid}`}>
                  <InputBlockCard input_block={input_block} />
                </div>
              ))}
            </div>
          )}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              {currentPlugin.templates.map((template) => (
                <div key={`${template.gid}:${template.cid}`}>
                  <TemplateCard template={template} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
