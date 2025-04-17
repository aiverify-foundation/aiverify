'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
// import { useChecklistSubmission } from '../../hooks/useUploadSubmission';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { useMDXSummaryBundle } from '@/app/inputs/hooks/useMDXSummaryBundle';
import { UploadIcon } from '@/app/models/upload/utils/icons';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import { useInputBlockGroupSubmission } from '../../../upload/hooks/useUploadSubmission';
import { excelToJson } from '../utils/excelToJson';
import styles from './ExcelUploader.module.css';

// Define the interface for checklist submissions
interface ChecklistSubmission {
  gid: string;
  cid: string;
  name: string;
  group: string;
  data: Record<string, string>;
}

// Define an interface for the input block data structure
interface InputBlockData {
  id: string;
  gid: string;
  cid: string;
  group: string;
  data: Record<string, string>; // For other properties that may exist
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
  const [unmatchedSheets, setUnmatchedSheets] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  // Preload the MDX bundle to ensure it's available
  const { error: mdxError } = useMDXSummaryBundle(
    'aiverify.stock.process_checklist',
    'export_process_checklists'
  );
  const { gid, group, groupDataList } = useInputBlockGroupData();

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

  const overwriteChecklists = async () => {
    setIsConfirmModalVisible(false);
    setIsUploading(true);

    try {
      console.log(
        `Overwriting ${duplicateSubmissions.length} checklists for group "${groupName}"`
      );

      // Step 1: Fetch all existing input block data in a single request
      const response = await fetch('/api/input_block_data');
      if (!response.ok) {
        throw new Error(
          `Failed to fetch existing input block data: ${response.statusText}`
        );
      }

      const allInputBlockData = await response.json();
      console.log(
        `Retrieved ${allInputBlockData.length} existing input blocks`
      );

      // Step 2: Create a lookup map for faster matching by gid, cid, and group
      const inputBlockLookupMap = allInputBlockData.reduce(
        (map: Record<string, string>, item: InputBlockData) => {
          // Create a unique key combining gid, cid, and group
          const key = `${item.gid}|${item.cid}|${item.group}`;
          map[key] = item.id;
          return map;
        },
        {}
      );

      // Step 3: Process each submission with PUT request to update existing data
      for (const submission of duplicateSubmissions) {
        // Create the same unique key format for this submission
        const lookupKey = `${submission.gid}|${submission.cid}|${submission.group}`;
        const existingId = inputBlockLookupMap[lookupKey];

        if (existingId) {
          // Use PUT to update the existing checklist
          const updateResponse = await fetch(
            `/api/input_block_data/${existingId}`,
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

          console.log(
            `Successfully updated checklist ${submission.cid} with ID ${existingId}`
          );
        } else {
          console.warn(
            `No existing input block found for ${submission.cid} in group ${submission.group}`
          );
        }
      }

      let message = `Successfully overwritten ${duplicateSubmissions.length} checklists for group "${groupName}"!`;

      // Add information about unmatched sheets if any
      if (unmatchedSheets && unmatchedSheets.length > 0) {
        message += `\n\n${unmatchedSheets.length} sheet(s) did not exactly match any principle name and were not uploaded: ${unmatchedSheets.join(', ')}.\n\nSheet names must exactly match principle names (case-insensitive).`;
      }

      setModalMessage(message);
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

      // MERGE
      setGroupName(fileGroupName);

      console.log('Processing Excel file:', file.name);
      console.log('Using group name:', fileGroupName);

      const result = await excelToJson(file, fileGroupName);
      const { submissions, unmatchedSheets: unmatchedSheetsList } = result;

      // Store unmatched sheets for later use in messages
      setUnmatchedSheets(unmatchedSheetsList || []);

      // if (submissions && submissions.length > 0) {
      //   console.log(`Submitting ${submissions.length} checklists`);

      //   try {
      //     for (const submission of submissions) {
      //       await submitChecklist(submission);
      //     }

      //     let message = `Upload Successful! Processed ${submissions.length} checklists.`;

      //     // Add information about unmatched sheets if any
      //     if (unmatchedSheetsList && unmatchedSheetsList.length > 0) {
      //       message += `\n\n${unmatchedSheetsList.length} sheet(s) did not exactly match any principle name and were not uploaded: ${unmatchedSheetsList.join(', ')}.\n\nSheet names must exactly match principle names (case-insensitive).`;
      //     }

      //     setModalMessage(message);
      //     setIsModalVisible(true);
      //   } catch (error: unknown) {
      //     console.log('Error during checklist submission:', error);

      //     // Check if it's a duplicate checklist error (400 with specific message)
      //     const submissionError = error as SubmissionError;
      //     if (
      //       submissionError.message &&
      //       submissionError.message.includes('already exists')
      //     ) {
      //       console.log(
      //         'Detected duplicate checklist error:',
      //         submissionError.message
      //       );

      //       // Store submissions for potential overwrite
      //       setDuplicateSubmissions(submissions);

      //       // Show confirmation modal for overwrite
      //       setIsConfirmModalVisible(true);
      //     } else {
      //       // Other error types
      //       let message = `Upload failed: ${submissionError.message || 'Unknown error'}`;

      //       // Add information about unmatched sheets if any
      //       if (unmatchedSheetsList && unmatchedSheetsList.length > 0) {
      //         message += `\n\nAdditionally, ${unmatchedSheetsList.length} sheet(s) did not exactly match any principle name: ${unmatchedSheetsList.join(', ')}.\n\nSheet names must exactly match principle names (case-insensitive).`;
      //       }

      //       setModalMessage(message);
      //       setIsModalVisible(true);
      //     }
      //   }
      // } else {
      //   let message =
      //     'Upload complete, but no valid checklists were found in the file.';

      //   // If we have unmatched sheets, mention them specifically
      //   if (unmatchedSheetsList && unmatchedSheetsList.length > 0) {
      //     message += `\n\n${unmatchedSheetsList.length} sheet(s) could not be matched because their names did not exactly match any principle name: ${unmatchedSheetsList.join(', ')}.\n\nSheet names must exactly match principle names (case-insensitive).`;
      //   }

      //   console.warn(message);
      //   setModalMessage(message);
      //   setIsModalVisible(true);
      // for (const submission of submissions) {
      //   await submitChecklist(submission);
      // }
      const input_blocks = submissions.map((x) => ({
        cid: x.cid,
        data: x.data,
      }));

      const found = groupDataList?.find((x) => x.name == fileGroupName);
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
        setModalMessage(`Upload Successful and overwrite ${fileGroupName}`);
        setIsModalVisible(true);
        if (res && res.ok) {
          if (!(flow && projectId)) {
            router.push(
              `/inputs/groups/${encodeURI(gid)}/${encodeURI(group)}/${found.id}`
            );
          }
        }
      } else {
        const res = await submitChecklist({
          gid: submissions[0].gid,
          name: fileGroupName,
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
            height={300}>
            <p
              id="upload-confirmation-message"
              style={{ whiteSpace: 'pre-line' }}>
              {modalMessage}
            </p>
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
                        Must start with group name and end with
                        &apos;_checklists.xlsx&apos;
                      </span>
                    </li>
                    <li role="listitem">
                      Excel Sheet Names:{' '}
                      <span className="text-secondary-300">
                        Ensure that each sheet have the correct names as
                        follows, else it will not be uploaded: Transparency,
                        Explainability, Reproducibility, Safety, Security,
                        Robustness, Fairness, Data Governance, Accountability,
                        Human Agency Oversight, Inclusive Growth, Organisational
                        Considerations. Ensure that the Completed column is
                        filled with a Yes, No or Not Applicable, else it will be
                        a blank value.
                      </span>
                    </li>
                    <li role="listitem">
                      Excel Sheet Content:{' '}
                      <span className="text-secondary-300">
                        Only content in the columns: Completed, Elaboration, and
                        the section for Summary Justification will be uploaded.
                        Ensure that the Completed column is filled with a Yes,
                        No or Not Applicable, else it will be a blank value.
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
