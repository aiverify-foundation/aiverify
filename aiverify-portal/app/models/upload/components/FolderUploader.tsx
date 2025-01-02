'use client';

import { useState } from 'react';
import styles from './Uploader.module.css';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import { Icon, IconName } from '@/lib/components/IconSVG';
import useUploadFolder from '@/app/models/upload/hooks/useUploadFolder';

const FolderUpload = ({ onBack }: { onBack: () => void }) => {
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
        formData.append('file_type', 'folder');
        formData.append('subfolders', subfolder);

        for (let pair of formData.entries()) {
            console.log("paired:", pair[0], pair[1]);
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
            <h3 className='text-2xl font-semibold mb-4'>Upload Model Folder</h3>
            <div className=''>
                <form onSubmit={handleSubmit} className="w-full">
                    <div className='flex items-center gap-20 w-full pb-4'>
                        <h2>If you have a model file, use the file uploader below</h2>
                        <div 
                        className={`${styles.dropzone} flex-1`} 
                        onClick={() => document.getElementById("fileInput")?.click()} 
                        onDrop={handleDrop} 
                        onDragOver={handleDragOver}>
                            <p className="text-gray-500">Drag and drop files here, or click to select files</p>
                            <input
                            id="fileInput"
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFiles(e.target.files || [])}
                            />
                        </div>
                    </div>
                    <div className='flex justify-between mt-4'>
                        <div className="mb-4">
                        <label className="block text-white font-medium">Folder Name:*</label>
                        <input
                        type="text"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        required
                        className="w-full text-black border border-gray-300 rounded-md p-2"
                        />
                        </div>
                        <div className="mb-4">
                            <label className="block text-white font-medium">Model Type:*</label>
                            <select
                            value={modelType}
                            onChange={(e) => setModelType(e.target.value)}
                            required
                            className="w-full h text-black border border-gray-300 rounded-md p-2"
                            >
                            <option value="">Select</option>
                            <option value="regression">Regression</option>
                            <option value="classification">Classification</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-white font-medium">Subfolder:</label>
                            <input
                            type="text"
                            value={subfolder}
                            onChange={(e) => setSubfolder(e.target.value)}
                            className="w-full text-black border border-gray-300 rounded-md p-2"
                            />
                        </div>
                    </div>
                <h3 className="text-lg font-medium text-white mb-2 mt-2">Selected Files:</h3>
                {selectedFiles && selectedFiles.length > 0 && (
                    <div className="mb-8">
                    <div className='mt-4 border-2 border-gray-400 p-4 rounded-lg overflow-y-auto max-h-64'>
                        <ul className="list-disc list-inside text-gray-300">
                        {Array.from(selectedFiles).map((file, index) => (
                            <li key={index} className="flex items-center space-x-20 space-y-4">
                                <Icon
                                    name={IconName.Close}
                                    onClick={() => handleRemoveFile(index)}
                                    color='#FFFFFF'
                                />
                                <span>{file.name}</span>
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
                    disabled={isLoading || !selectedFiles || selectedFiles.length === 0}
                    text={isLoading ? 'Uploading...' : 'Upload Folder'}
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

export default FolderUpload;
