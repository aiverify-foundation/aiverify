'use client';

import React, { useState, useEffect } from 'react';
import { Plugin } from '@/app/types';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import WidgetCard from './DisplayWidget';
import AlgorithmCard from './DisplayAlgorithm';
import { downloadWidgets } from '@/lib/fetchApis/downloadWidgets';
import { deletePlugin } from '@/lib/fetchApis/deletePlugin';
import { DeleteIcon } from '../utils/icons';


type Props = {
  plugin: Plugin | null;
};

export default function PluginDetail({ plugin }: Props) {
  const [activeTab, setActiveTab] = useState<'widgets' | 'algorithms'>('widgets');
  const [currentPlugin, setCurrentPlugin] = useState<Plugin | null>(plugin);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDeleteGid, setConfirmDeleteGid] = useState<string | null>(null);


  useEffect(() => {
    setCurrentPlugin(plugin);
  }, [plugin]);


  // This handles the deletion and sets the modal message
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
            <DeleteIcon onClick={() => handleDelete(currentPlugin.gid)} />
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
        <div className="flex justify-start border-b border-gray-700 space-x-1 mb-4">
            <button
            className={`py-2 px-6 rounded-t ${
                activeTab === 'widgets'
                ? 'border-b-4 border-primary-500 bg-secondary-200 text-secondary-950 font-semibold'
                : 'text-secondary-950 bg-secondary-300'
            }`}
            onClick={() => setActiveTab('widgets')}
            >
            Widgets
            </button>
            <button
            className={`py-2 px-6 rounded-t ${
                activeTab === 'algorithms'
                ? 'border-b-4 border-primary-500 bg-secondary-200 text-secondary-950 font-semibold'
                : 'text-secondary-950 bg-secondary-300'
            }`}
            onClick={() => setActiveTab('algorithms')}
            >
            Algorithms
            </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <div>
          {activeTab === 'widgets' && (
            <div>
              <div className='flex justify-end mb-4'>
                <Button
                  pill
                  textColor="white"
                  variant={ButtonVariant.PRIMARY}
                  size="sm"
                  text="DOWNLOAD WIDGETS"
                  color="var(--color-primary-500)"
                  onClick={() => handleDownloadWidget(currentPlugin.gid)}
                />
              </div>
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
                  <div key={`$algorithm.cid:${algorithm.cid}`}>
                    <AlgorithmCard algorithm={algorithm} />
                  </div>
              ))}
              </div>
          )}
          </div>
        </div>
    </div>

  );
}
