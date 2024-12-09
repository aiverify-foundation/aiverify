//plugindetails

'use client';

import React, { useState, useEffect } from 'react';
import { Plugin } from '@/app/types';
import { deletePlugin } from '@/lib/fetchApis/deletePlugin';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import WidgetCard from './DisplayWidget';
import { downloadWidgets } from '@/lib/fetchApis/downloadWidgets';


type Props = {
  plugin: Plugin | null;
};

export default function PluginDetail({ plugin }: Props) {
  const [activeTab, setActiveTab] = useState<'widgets' | 'algorithms'>('widgets');
  const [currentPlugin, setCurrentPlugin] = useState<Plugin | null>(plugin);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCurrentPlugin(plugin);
  }, [plugin]);


  const handleDelete = async (id: number) => {
    try {
      await deletePlugin(id);
      setModalMessage('Result deleted successfully!');
      setIsModalVisible(true);
    } catch (error) {
      console.error('Failed to delete result:', error);
      setModalMessage('Failed to delete the result.');
      setIsModalVisible(true);
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
    {/* Popup for deleting */}
    {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <Modal
                bgColor="var(--color-primary-500)"
                textColor="white"
                onCloseIconClick={() => setIsModalVisible(false)}
                enableScreenOverlay
                heading=""
                height={150}
            >
                <p>{modalMessage}</p>
            </Modal>
        </div>
    )}

        <div className="pb-4 mb-4">
            <h3 className="text-2xl font-semibold mb-2">{currentPlugin.name}</h3>
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
          <div className='flex justify-end'>
            <Button
              pill
              textColor="white"
              variant={ButtonVariant.PRIMARY}
              size="sm"
              text="DOWNLOAD WIDGETS"
              color='primary-100'
              onClick={() => handleDownloadWidget(currentPlugin.gid)}
            />
          </div>
          <div className="mt-4">
          {activeTab === 'widgets' && (
              <div className="space-y-4">
              {currentPlugin.widgets.map((widget) => (
                  <div key={`${widget.gid}:${widget.cid}`}>
                  <WidgetCard widget={widget} />
                  </div>
              ))}
              </div>
          )}

          {activeTab === 'algorithms' && (
              <div className="space-y-4">
              {currentPlugin.algorithms.map((algorithm) => (
                  <div
                  key={algorithm.cid}
                  className="p-4 border border-gray-800 rounded-lg"
                  >
                  <h4 className="text-sm font-bold">{algorithm.name}</h4>
                  <p className="text-xs text-gray-400">{algorithm.description}</p>
                  <p className="text-xs">
                      <strong>Language:</strong> {algorithm.language}
                  </p>
                  </div>
              ))}
              </div>
          )}
          </div>
        </div>
    </div>

  );
}
