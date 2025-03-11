'use client';

import { useState } from 'react';
import useUploadFolder from '@/app/models/upload/hooks/useUploadFolder';
import { UploadIcon } from '@/app/models/upload/utils/icons';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import styles from './Uploader.module.css';

const PipelineUploader = ({ onBack }: { onBack: () => void }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [folderName, setFolderName] = useState('');
  const [modelType, setModelType] = useState('');
  const [subfolder, setSubfolder] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const { mutate, status } = useUploadFolder();
  const isLoading = status === 'pending';

  const handleFiles = (files: FileList | File[]) => {
    setSelectedFiles((prevFiles) => [...prevFiles, ...Array.from(files)]);
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
    if (!selectedFiles) {
      setModalMessage('Please select files to upload.');
      setIsModalVisible(true);
      return;
    }

    if (!folderName || !modelType) {
      setModalMessage('Please fill in all required fields.');
      setIsModalVisible(true);
      return;
    }

    const formData = new FormData();
    Array.from(selectedFiles).forEach((file) => formData.append('files', file));
    formData.append('foldername', folderName);
    formData.append('model_type', modelType);
    formData.append('file_type', 'pipeline');
    formData.append('subfolders', subfolder);

    for (const pair of formData.entries()) {
      console.log('paired:', pair[0], pair[1]);
    }

    mutate(formData, {
      onSuccess: () => {
        setModalMessage('Folder uploaded successfully!');
        setIsModalVisible(true);
        setFolderName('');
        setModelType('');
        setSubfolder('');
        setSelectedFiles([]);
      },
      onError: () => {
        setModalMessage('Error uploading folder.');
        setIsModalVisible(true);
      },
    });
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  return (
    <div className="relative flex h-full overflow-y-auto scrollbar-hidden">
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

      <div className="w-full pl-6 pr-6 pt-2">
        <div className="flex w-full flex-col overflow-y-auto scrollbar-hidden">
          {/* Back Button */}
          <div className="mb-4 flex items-center">
            <Icon
              name={IconName.ArrowLeft}
              color="white"
              onClick={onBack}
            />
            <h3 className="ml-4 text-2xl font-semibold">
              Add New AI Model {'>'} Upload Model Pipeline
            </h3>
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full">
            {/* Upload Requirements */}
            <div className="flex w-full items-start space-x-20 p-4">
              {/* Left Section: Header, Description, and Requirements */}
              <div className="w-1/2">
                <h2 className="text-lg font-semibold">Before uploading...</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Check that the model pipeline meets the following
                  requirements.
                </p>

                <div className="mt-4 rounded-lg border border-secondary-300 p-4">
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>
                      <strong>File Size:</strong> Less than 4GB
                    </li>
                    <li>
                      <strong>Data Format:</strong> Scikit-learn Pipeline
                    </li>
                    <li>
                      <strong>Serializer Type:</strong> Pickle or Joblib
                    </li>
                    <li>
                      <strong>Pipeline Structure:</strong> Must include
                      preprocessing steps
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
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files || [])}
                />
              </div>
            </div>

            <div className="flex justify-start gap-8 p-2 pl-4">
              <div>
                <label className="block font-medium text-white">
                  Folder Name:*
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  required
                  maxLength={128}
                  minLength={1}
                  className="h-2 rounded-md border border-gray-300 p-2 text-black"
                />
              </div>
              <div>
                <label className="block font-medium text-white">
                  Model Type:*
                </label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  required
                  className="rounded-md border border-secondary-300 text-black">
                  <option value="">Select</option>
                  <option value="regression">Regression</option>
                  <option value="classification">Classification</option>
                </select>
              </div>
            </div>

            <h3 className="mb-2 p-4 text-lg font-medium text-white">
              Selected Files:
            </h3>
            {selectedFiles && selectedFiles.length > 0 && (
              <div className="mb-8 mt-8">
                <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border-2 border-gray-400 p-6">
                  <ul className="list-inside list-disc text-white">
                    {Array.from(selectedFiles).map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center space-x-20 space-y-4">
                        <Icon
                          name={IconName.Close}
                          onClick={() => handleRemoveFile(index)}
                          color="#FFFFFF"
                        />
                        <span className="text-white">{file.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="mb-6 mt-6 mt-auto flex items-center justify-end">
              <Button
                size="sm"
                type="submit"
                pill
                variant={ButtonVariant.PRIMARY}
                disabled={
                  isLoading || !selectedFiles || selectedFiles.length === 0
                }
                text={isLoading ? 'Uploading...' : 'UPLOAD PIPELINE'}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PipelineUploader;
