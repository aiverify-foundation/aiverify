'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { excelToJson } from '@/app/inputs/checklists/upload/excel/utils/excelToJson';
import { useChecklistSubmission } from '@/app/inputs/checklists/upload/hooks/useUploadSubmission';
import { useMDXSummaryBundle } from '@/app/inputs/hooks/useMDXSummaryBundle';
import { UploadIcon } from '@/app/models/upload/utils/icons';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import styles from './ExcelUploader.module.css';

// Define the interface for checklist submissions
interface ChecklistSubmission {
  gid: string;
  cid: string;
  name: string;
  group: string;
  data: Record<string, string>;
}

// Define the error interface
interface SubmissionError {
  message?: string;
  statusCode?: number;
  details?: unknown;
}

const ExcelUploader = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [duplicateSubmissions, setDuplicateSubmissions] = useState<
    ChecklistSubmission[]
  >([]);
  const [groupName, setGroupName] = useState('');

  // Preload the MDX bundle to ensure it's available
  const { error: mdxError } = useMDXSummaryBundle(
    'aiverify.stock.process_checklist',
    'export_process_checklists'
  );

  const { submitChecklist } = useChecklistSubmission();

  const handleBack = () => {
    const flow = searchParams.get('flow');
    const projectId = searchParams.get('projectId');

    if (flow && projectId) {
      router.push(
        `/inputs/checklists/upload?flow=${flow}&projectId=${projectId}`
      );
    } else {
      router.push('/inputs/checklists');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const overwriteChecklists = async () => {
    setIsConfirmModalVisible(false);
    setIsUploading(true);

    try {
      console.log(
        `Overwriting ${duplicateSubmissions.length} checklists for group "${groupName}"`
      );

      // Process each submission with PUT request instead of POST
      for (const submission of duplicateSubmissions) {
        // Get existing checklist ID by querying API
        const queryParams = new URLSearchParams({
          gid: submission.gid,
          cid: submission.cid,
          group: submission.group,
        });

        const response = await fetch(`/api/input_block_data?${queryParams}`);
        if (response.ok) {
          const existingChecklist = await response.json();
          if (existingChecklist && existingChecklist.length > 0) {
            // Use PUT to update the existing checklist
            const updateResponse = await fetch(
              `/api/input_block_data/${existingChecklist[0].id}`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(submission),
              }
            );

            if (!updateResponse.ok) {
              throw new Error(
                `Failed to update checklist ${submission.cid}: ${updateResponse.statusText}`
              );
            }
          }
        }
      }

      setModalMessage(
        `Successfully overwritten ${duplicateSubmissions.length} checklists for group "${groupName}".`
      );
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error during overwrite process:', error);
      setModalMessage(
        `Overwrite failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsModalVisible(true);
    } finally {
      setIsUploading(false);
      setDuplicateSubmissions([]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    // Check if MDX bundle is available
    if (mdxError) {
      setModalMessage(
        `Error loading conversion functions: ${mdxError.message}`
      );
      setIsModalVisible(true);
      return;
    }

    setIsUploading(true);

    try {
      const fileGroupName = file.name
        .replace('.xlsx', '')
        .replace('_checklists', '');

      setGroupName(fileGroupName);

      console.log('Processing Excel file:', file.name);
      console.log('Using group name:', fileGroupName);

      const submissions = await excelToJson(file, fileGroupName);

      if (submissions && submissions.length > 0) {
        console.log(`Submitting ${submissions.length} checklists`);

        try {
          for (const submission of submissions) {
            await submitChecklist(submission);
          }

          setModalMessage(
            `Upload Successful! Processed ${submissions.length} checklists.`
          );
          setIsModalVisible(true);
        } catch (error: unknown) {
          console.log('Error during checklist submission:', error);

          // Check if it's a duplicate checklist error (400 with specific message)
          const submissionError = error as SubmissionError;
          if (
            submissionError.message &&
            submissionError.message.includes('already exists')
          ) {
            console.log(
              'Detected duplicate checklist error:',
              submissionError.message
            );

            // Store submissions for potential overwrite
            setDuplicateSubmissions(submissions);

            // Show confirmation modal for overwrite
            setIsConfirmModalVisible(true);
          } else {
            // Other error types
            setModalMessage(
              `Upload failed: ${submissionError.message || 'Unknown error'}`
            );
            setIsModalVisible(true);
          }
        }
      } else {
        console.warn('No valid checklists were found in the file');
        setModalMessage(
          'Upload complete, but no valid checklists were found in the file.'
        );
        setIsModalVisible(true);
      }
    } catch (error) {
      console.error('Error during upload process:', error);
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

  const closeConfirmModal = () => {
    setIsConfirmModalVisible(false);
    setDuplicateSubmissions([]);
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
      {/* Upload Status Modal */}
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

      {/* Confirmation Modal for Overwrite */}
      {isConfirmModalVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-label="overwrite confirmation modal">
          <Modal
            bgColor="var(--color-warning-500)"
            textColor="white"
            onCloseIconClick={closeConfirmModal}
            enableScreenOverlay
            heading="Duplicate Checklists Detected"
            height={250}
            primaryBtnLabel="Yes, Overwrite"
            secondaryBtnLabel="Cancel"
            onPrimaryBtnClick={overwriteChecklists}
            onSecondaryBtnClick={closeConfirmModal}>
            <div className="mb-4">
              <p>
                There is an existing group of checklists with the name &quot;
                {groupName}&quot;. Do you want to overwrite these checklists?
              </p>
            </div>
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
