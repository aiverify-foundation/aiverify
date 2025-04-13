'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { UploadIcon } from '@/app/models/upload/utils/icons';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import { useInputBlockGroupSubmission } from '../../../upload/hooks/useUploadSubmission';
import { excelToJson } from '../utils/excelToJson';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import styles from './ExcelUploader.module.css';

const ExcelUploader = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const { gid, group, groupDataList, setInputBlockData } =
    useInputBlockGroupData();

  const { submitInputBlockGroup: submitChecklist } =
    useInputBlockGroupSubmission();
  const flow = searchParams.get('flow');
  const projectId = searchParams.get('projectId');

  const handleBack = () => {
    if (flow && projectId) {
      router.push(
        `/inputs/groups/${encodeURI(gid)}/${encodeURI(group)}/upload?flow=${flow}&projectId=${projectId}`
      );
    } else {
      router.push(`/inputs/groups/${encodeURI(gid)}/${encodeURI(group)}`);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setIsUploading(true);

    try {
      const groupName = file.name.replace('_checklists.xlsx', '');
      const submissions = await excelToJson(file, groupName);

      // for (const submission of submissions) {
      //   await submitChecklist(submission);
      // }
      const input_blocks = submissions.map((x) => ({
        cid: x.cid,
        data: x.data,
      }));

      const found = groupDataList?.find((x) => x.name == groupName);
      if (found) {
        const res = await fetch(`/api/input_block_data/groups/${found.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // name: found.name,
            input_blocks,
          }),
        });
        setModalMessage(`Upload Successful and overwrite ${groupName}`);
        setIsModalVisible(true);
        if (res && res.ok) {
          if (!(flow && projectId)) {
            router.push(
              `/inputs//groups/${encodeURI(gid)}/${encodeURI(group)}/${found.id}`
            );
          }
        }
      } else {
        const res = await submitChecklist({
          gid: submissions[0].gid,
          name: groupName,
          group,
          input_blocks,
        });
        setModalMessage('Upload Successful!');
        setIsModalVisible(true);
        if (res && res.ok && res.id) {
          if (!(flow && projectId)) {
            router.push(
              `/inputs/groups/${encodeURI(gid)}/${encodeURI(group)}/${res.id}`
            );
          }
        }
      }
    } catch (error) {
      setModalMessage(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsModalVisible(true);
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div
      className="relative mb-8 flex h-[calc(100vh-100px)] overflow-y-auto rounded-lg bg-secondary-950 pl-10 scrollbar-hidden"
      role="region"
      aria-label="Excel uploader container">
      {/* Upload Popup */}
      {isModalVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-label="upload status modal">
          <Modal
            bgColor="var(--color-primary-500)"
            textColor="white"
            onCloseIconClick={closeModal}
            enableScreenOverlay
            heading="Upload Excel File"
            height={200}>
            <p id="upload-confirmation-message">{modalMessage}</p>
          </Modal>
        </div>
      )}
      <div className="mt-6 w-full">
        <div
          className="mb-8 flex items-center justify-between"
          role="banner"
          aria-label="Uploader header">
          <div className="flex items-center">
            <div
              onClick={handleBack}
              className="cursor-pointer">
              <Icon
                name={IconName.ArrowLeft}
                color="white"
                size={30}
                aria-label="Back to checklists"
              />
            </div>
            <h1
              className="ml-6 text-2xl font-semibold text-white"
              aria-label="upload excel header"
              aria-level={1}>
              Add New Checklists {'>'} Upload Excel File
            </h1>
          </div>
        </div>
        <div className="flex">
          <div
            className="mr-20 flex w-full flex-col"
            role="main"
            aria-label="File upload section">
            <div className="flex gap-4">
              <div className="flex-1">
                <h3>Before uploading...</h3>
                <p className="mb-6 text-[0.9rem] text-secondary-300">
                  Check that the Excel file meets the following requirements.
                </p>
                <div className="rounded-md border border-secondary-400 p-4 text-[0.8rem]">
                  <ul
                    className="list-none"
                    role="list"
                    aria-label="list of excel upload requirements">
                    <li role="listitem">
                      File Format:{' '}
                      <span className="text-secondary-300">.xlsx</span>
                    </li>
                    <li role="listitem">
                      File Size:{' '}
                      <span className="text-secondary-300">Less than 10MB</span>
                    </li>
                    <li role="listitem">
                      File Name:{' '}
                      <span className="text-secondary-300">
                        Must end with &apos;_checklists.xlsx&apos;
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div
                className={`${styles.dropzone} flex-1`}
                onClick={() => document.getElementById('fileInput')?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                role="button"
                aria-label="File drop zone">
                <input
                  type="file"
                  id="fileInput"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept=".xlsx"
                />
                <UploadIcon size={80} />
                <p className="mt-2 text-sm text-gray-300">
                  <span className="text-purple-400">Drag & drop</span> or{' '}
                  <span className="cursor-pointer text-purple-400">
                    Click to Browse
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Only Excel files are supported
                </p>
              </div>
            </div>

            <h2 className="mb-2 mt-10 text-lg font-semibold">
              Selected Files:
            </h2>
            <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border-2 border-gray-400 p-4">
              {file && (
                <div className={styles.fileItem}>
                  <div className={styles.fileHeader}>
                    <div className={styles.fileName}>{file.name}</div>
                    <button
                      className={styles.removeButton}
                      onClick={() => setFile(null)}>
                      <Icon
                        name={IconName.Close}
                        color="white"
                      />
                    </button>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBar}
                      style={{
                        width: isUploading ? '100%' : '0%',
                        backgroundColor: isUploading ? 'green' : 'transparent',
                      }}
                    />
                  </div>
                  <span className={styles.fileStatus}>
                    {isUploading ? 'uploading' : 'ready'}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-auto mt-5 flex items-center">
              <Button
                className="mb-5 rounded-md border-none bg-primary-400 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:bg-secondary-900 disabled:text-secondary-600"
                size="sm"
                variant={ButtonVariant.PRIMARY}
                onClick={handleSubmit}
                disabled={isUploading || !file}
                text={isUploading ? 'UPLOADING...' : 'CONFIRM UPLOAD'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelUploader;
