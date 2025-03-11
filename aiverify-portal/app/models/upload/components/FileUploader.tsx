'use client';

import React, { useState } from 'react';
import useUploadFile from '@/app/models/upload/hooks/useUploadFile';
import { UploadIcon } from '@/app/models/upload/utils/icons';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import styles from './Uploader.module.css';

const FileUploader = () => {
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

    for (const pair of formData.entries()) {
      console.log('paired:', pair[0], pair[1]);
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
    <div className="relative flex h-full">
      {/* Modal Popup */}
      {isModalVisible && (
        <Modal
          bgColor="var(--color-primary-500)"
          textColor="white"
          onCloseIconClick={closeModal}
          enableScreenOverlay
          heading="Upload Status"
          height={200}>
          <p>{modalMessage}</p>
        </Modal>
      )}

      <div className="mt-6 w-full">
        <div className="flex w-full flex-col overflow-y-auto scrollbar-hidden">
          <div className="">
            <form
              onSubmit={handleSubmit}
              className="w-full">
              {/* Upload Requirements */}
              <div className="flex w-full items-start space-x-20 p-4">
                {/* Left Section: Header, Description, and Requirements */}
                <div className="w-1/2">
                  <h2 className="text-lg font-semibold">Before uploading...</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    Check that the model file meets the following requirements.
                  </p>
                  <div className="mt-4 rounded-lg border border-secondary-300 p-4">
                    <ul className="mt-2 space-y-2 text-sm">
                      <li>
                        <strong>File Size:</strong> Less than 4GB
                      </li>
                      <li>
                        <strong>Data Format:</strong> LightGBM, Scikit-learn,
                        TensorFlow, XGBoost
                      </li>
                      <li>
                        <strong>Serializer Type:</strong> Pickle or Joblib
                      </li>
                      <li className="text-xs text-gray-400">
                        * If your model includes data preprocessing, upload the
                        pipeline <span className="text-purple-400">here</span>{' '}
                        instead.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right Section: Drag & Drop Upload */}
                <div
                  className={`${styles.dropzone} flex-1`}
                  onClick={() => document.getElementById('fileInput')?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}>
                  <UploadIcon size={80} />
                  <p className="mt-2 text-sm text-gray-300">
                    <span className="text-purple-400">Drag & drop</span> or{' '}
                    <span className="cursor-pointer text-purple-400">
                      Click to Browse
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum 10 files per upload
                  </p>
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
              <h3 className="mb-2 p-4 text-lg font-medium text-white">
                Selected Files:
              </h3>
              {/* Selected Files Section */}
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mb-8 mt-8 pl-4 pr-6">
                  <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-secondary-300 p-6">
                    <ul className="list-inside list-disc space-y-4 text-white">
                      {selectedFiles.map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-8 space-x-8">
                          <Icon
                            name={IconName.Close}
                            onClick={() => handleRemoveFile(index)}
                            color="#FFFFFF"
                          />
                          <span
                            className="text-white"
                            style={{ marginTop: '0px', marginLeft: '0px' }}>
                            {file.name}
                          </span>
                          <div
                            className="ml-4 flex"
                            style={{ marginTop: '0px', marginLeft: '0px' }}>
                            <label className="mr-2 font-medium text-white">
                              Model Type*:
                            </label>
                            <select
                              value={modelTypes[index]}
                              required
                              onChange={(e) =>
                                handleModelTypeChange(index, e.target.value)
                              }
                              className="rounded-md border border-secondary-300 text-black">
                              <option value="">Select</option>
                              <option value="regression">Regression</option>
                              <option value="classification">
                                Classification
                              </option>
                            </select>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="mb-6 mt-6 mt-auto flex items-center justify-end">
                <Button
                  pill
                  size="sm"
                  type="submit"
                  variant={ButtonVariant.PRIMARY}
                  disabled={
                    isLoading || !selectedFiles || selectedFiles.length === 0
                  }
                  text={isLoading ? 'Uploading...' : 'UPLOAD FILE(S)'}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
