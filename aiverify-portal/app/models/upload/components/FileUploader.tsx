'use client';

import React, { useState } from 'react';
import styles from './Uploader.module.css';
import useUploadFile from '@/app/models/upload/hooks/useUploadFile';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import { Icon, IconName } from '@/lib/components/IconSVG';

const FileUploader = ({ onBack }: { onBack: () => void }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const { mutate, status } = useUploadFile();
  const isLoading = status === 'pending';

  const handleFiles = (files: FileList | File[]) => {
    setSelectedFiles((prevFiles) => [...prevFiles, ...Array.from(files)]);
    setModelTypes((prevTypes) => [
      ...prevTypes,
      ...Array.from(files).map(() => ''),
    ]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setModalMessage('Please select or drop files to upload.');
      setIsModalVisible(true);
      return;
    }
  
    if (modelTypes.some((type) => type === '')) {
      setModalMessage('Please select a model type for all files.');
      setIsModalVisible(true);
      return;
    }

    console.log('Selected files:', selectedFiles);
    console.log('Model types:', modelTypes);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      console.log(`Appending file: ${file.name}`);
      formData.append('files', file); // Correct field name without array syntax
    });
  
    // Join the model types as a comma-separated string
    const modelTypesString = modelTypes.join(',');
    console.log(`Appending model types: ${modelTypesString}`);
    formData.append('model_types', modelTypesString); 
    

    for (let pair of formData.entries()) {
      console.log("paired:", pair[0], pair[1]);
    }
  

    mutate(formData, {
      onSuccess: () => {
        setModalMessage('Files uploaded successfully!');
        setIsModalVisible(true);
        setSelectedFiles([]);
        setModelTypes([]);
      },
      onError: () => {
        setModalMessage('Error uploading files.');
        setIsModalVisible(true);
      },
    });
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handleModelTypeChange = (index: number, value: string) => {
    const updatedModelTypes = [...modelTypes];
    updatedModelTypes[index] = value;
    setModelTypes(updatedModelTypes);
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedModelTypes = modelTypes.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    setModelTypes(updatedModelTypes);
  };

  return (
    <div className='flex h-[calc(100vh-200px)] bg-secondary-950 pl-10 mb-8 overflow-y-auto scrollbar-hidden relative'>
      {/* Modal Popup */}
      {isModalVisible && (
        <Modal
          bgColor="var(--color-primary-500)"
          textColor="white"
          onCloseIconClick={closeModal}
          enableScreenOverlay
          heading="Upload Status"
          height={200}
        >
          <p>{modalMessage}</p>
        </Modal>
      )}

      <div className='mt-6 w-full'>
        <div className='flex'>
          <div className='mt-1 pr-12'>
            <Icon name={IconName.ArrowLeft} color='white' onClick={onBack}/>
          </div>
          <div className='flex flex-col w-full mr-20'>
            <h3 className='text-2xl font-semibold mb-4'>Upload AI Model</h3>
            <div className=''>
              <form onSubmit={handleSubmit} className="w-full">
                <div className='flex items-center gap-20 w-full'>
                  <h2>If you have a model file, use the file uploader below</h2>
                  <div
                    className={`${styles.dropzone} flex-1`}
                    onClick={() => document.getElementById("fileInput")?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <p className="text-gray-500">Drag and drop files here, or click to select files</p>
                    <input
                      id="fileInput"
                      type="file"
                      accept=".sav,.pkl"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files || [])}
                    />
                  </div>
                </div>
              {selectedFiles.length > 0 && (
                <div className="mb-8 mt-8">
                  <h3 className="text-lg font-medium text-white mb-2">Selected Files:</h3>
                  <div className='mt-4 border-2 border-gray-400 p-4 rounded-lg overflow-y-auto max-h-64'>
                    <ul className="list-disc list-inside text-gray-300">
                      {selectedFiles.map((file, index) => (
                        <li key={index} className="flex items-center space-x-20 space-y-4">
                          <Icon
                            name={IconName.Close}
                            onClick={() => handleRemoveFile(index)}
                            color='#FFFFFF'
                          />
                          <span>{file.name}</span>
                          <div className="ml-4">
                            <label className="block text-white font-medium">Model Type:</label>
                            <select
                              value={modelTypes[index]}
                              onChange={(e) => handleModelTypeChange(index, e.target.value)}
                              className="w-full text-gray-700 border border-gray-300 rounded-md"
                            >
                              <option value="">Select</option>
                              <option value="regression">Regression</option>
                              <option value="classification">Classification</option>
                            </select>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

                <Button
                  size="sm"
                  type="submit"
                  variant={ButtonVariant.PRIMARY}
                  disabled={isLoading}
                  text={isLoading ? 'Uploading...' : 'Upload Files'}
                  className="w-full flex items-center ml-auto mt-5"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
