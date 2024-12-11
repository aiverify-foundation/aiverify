'use client';

import React, { useState, useEffect } from 'react';
import { Plugin } from '../utils/types';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import WidgetCard from './DisplayWidget';
import AlgorithmCard from './DisplayAlgorithm';
import InputBlockCard from './DisplayInputBlocks';
import { downloadWidgets } from '@/lib/fetchApis/downloadWidgets';
import { deletePlugin } from '@/lib/fetchApis/deletePlugin';
import { DeleteIcon } from '../utils/icons';
import { downloadPlugin } from '@/lib/fetchApis/downloadPlugin';


type Props = {
  plugin: Plugin | null;
};

export default function PluginDetail({ plugin }: Props) {
  const [activeTab, setActiveTab] = useState<'widgets' | 'algorithms' | 'input_blocks' | 'templates' | null>(null);
  const [currentPlugin, setCurrentPlugin] = useState<Plugin | null>(plugin);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDeleteGid, setConfirmDeleteGid] = useState<string | null>(null);


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

  const confirmDelete = async () => {
    if (currentPlugin) {
      try {
        await deletePlugin(currentPlugin.gid);
        setModalMessage('Plugin deleted successfully!');
      } catch (error) {
        console.error('Failed to delete plugin:', error);
        setModalMessage('Failed to delete the plugin.');
      } finally {
        // Close the modal after action
        setTimeout(() => setIsModalVisible(false), 1500);
      }
    }
  };

  const handleDownloadWidget = async (gid: string) => {
    setIsLoading(true);

    try {
      const response = await downloadWidgets(gid);

      // Create a Blob URL from the response
      const fileBlob = await response.blob();
      const url = window.URL.createObjectURL(fileBlob);

      // Extract the filename from the Content-Disposition header
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'widget.zip';

      // Trigger the file download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      alert('Failed to download the widget file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPlugin = async (gid: string) => {
    setIsLoading(true);

    try {
      const response = await downloadPlugin(gid);

      // Create a Blob URL from the response
      const fileBlob = await response.blob();
      const url = window.URL.createObjectURL(fileBlob);

      // Extract the filename from the Content-Disposition header
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'plugin.zip';

      // Trigger the file download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      alert('Failed to download the plugin file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentPlugin) {
    return (
      <div className="text-white text-center mt-20">
        <p>Select a plugin to see details here.</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary-950 h-full text-white rounded-lg shadow-lg p-6 flex flex-col overflow-hidden">
    {/* Delete Popup */}
    {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
           <Modal
            bgColor="var(--color-primary-500)"
            textColor="white"
            onCloseIconClick={() => setIsModalVisible(false)}
            enableScreenOverlay
            heading="Confirm Deletion"
            height={200}
            primaryBtnLabel="DELETE"
            secondaryBtnLabel="CANCEL"
            onPrimaryBtnClick={confirmDelete} // Handles the actual deletion
            onSecondaryBtnClick={() => setIsModalVisible(false)} // Closes the modal
          >
            <p>{modalMessage}</p>
          </Modal>
        </div>
    )}
        {/* Metadata of Plugin */}
        <div className="pb-4 mb-4">
          <div className='flex items-center justify-between'>
            <h3 className="text-2xl font-semibold mb-2">{currentPlugin.name}</h3>
            <div className="flex items-center space-x-2">
              <Button
                    pill
                    textColor="white"
                    variant={ButtonVariant.OUTLINE}
                    hoverColor='var(--color-primary-500)'
                    size="sm"
                    text="DOWNLOAD"
                    onClick={() => handleDownloadPlugin(currentPlugin.gid)}
                  />
              <DeleteIcon onClick={() => handleDelete(currentPlugin.gid)} />
            </div>
            
          </div>
          <div className="space-y-1 text-sm">
          <p>{currentPlugin.description}</p>
          <p></p>
          <p>
              <span className="font-semibold">Version:</span> {currentPlugin.version}
          </p>
          <p>
              <span className="font-semibold">Author:</span> {currentPlugin.author}
          </p>
          <p>
              <span className="font-semibold">Installed on:</span>{' '}
              {new Date(currentPlugin.updated_at).toLocaleString('en-GB')}
          </p>
          </div>
        </div>

        {/* Tabs */}
        {(currentPlugin.widgets?.length > 0 || currentPlugin.algorithms?.length > 0) && (
        <div className="flex justify-start border-b border-gray-700 space-x-1 mb-4">
          {currentPlugin.widgets?.length > 0 && (
            <button
            className={`py-2 px-6 rounded-t ${
                activeTab === 'widgets'
                ? 'border-b-4 border-primary-500 bg-secondary-200 text-secondary-950 font-semibold '
                : 'text-secondary-950 bg-secondary-300'
            }`}
            onClick={() => setActiveTab('widgets')}
            >
            Widgets
            <span className="inline-flex ml-1 items-center justify-center bg-primary-500 text-white text-sm rounded-full w-5 h-5 text-center">
              {currentPlugin.widgets.length}
            </span>
            </button>
          )}
          {currentPlugin.algorithms?.length > 0 && (
            <button
            className={`py-2 px-6 rounded-t ${
                activeTab === 'algorithms'
                ? 'border-b-4 border-primary-500 bg-secondary-200 text-secondary-950 font-semibold'
                : 'text-secondary-950 bg-secondary-300'
            }`}
            onClick={() => setActiveTab('algorithms')}
            >
            Algorithms
            <span className="inline-flex ml-1 items-center justify-center bg-primary-500 text-white text-sm rounded-full w-5 h-5 text-center">
              {currentPlugin.algorithms.length}
            </span>
            </button>
          )}
          {currentPlugin.input_blocks?.length > 0 && (
            <button
            className={`py-2 px-6 rounded-t ${
                activeTab === 'input_blocks'
                ? 'border-b-4 border-primary-500 bg-secondary-200 text-secondary-950 font-semibold'
                : 'text-secondary-950 bg-secondary-300'
            }`}
            onClick={() => setActiveTab('input_blocks')}
            >
            Input Blocks
            <span className="inline-flex ml-1 items-center justify-center bg-primary-500 text-white text-sm rounded-full w-5 h-5 text-center">
              {currentPlugin.input_blocks.length}
            </span>
            </button>
          )}
          {currentPlugin.templates?.length > 0 && (
            <button
            className={`py-2 px-6 rounded-t ${
                activeTab === 'templates'
                ? 'border-b-4 border-primary-500 bg-secondary-200 text-secondary-950 font-semibold'
                : 'text-secondary-950 bg-secondary-300'
            }`}
            onClick={() => setActiveTab('templates')}
            >
            Templates
            <span className="inline-flex ml-1 items-center justify-center bg-primary-500 text-white text-sm rounded-full w-5 h-5 text-center">
              {currentPlugin.templates.length}
            </span>
            </button>
          )}
        </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
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
                  </div>
              ))}
              </div>
          )}
          </div>
        </div>
    </div>

  );
}
