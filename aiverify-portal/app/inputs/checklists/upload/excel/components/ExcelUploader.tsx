'use client';
import React, { useState } from 'react';
import { excelToJson } from '@/app/inputs/checklists/upload/excel/utils/excelToJson';
import { useChecklistSubmission } from '@/app/inputs/checklists/upload/hooks/useUploadSubmission';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import styles from './ExcelUploader.module.css';

const ExcelUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const { submitChecklist } = useChecklistSubmission();

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

      for (const submission of submissions) {
        await submitChecklist(submission);
      }

      setModalMessage('Upload Successful!');
      setIsModalVisible(true);
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

  return (
    <div className={styles.container}>
      <div className={styles.uploadSection}>
        <div
          className={styles.dropzone}
          onClick={() => document.getElementById('fileInput')?.click()}>
          <input
            type="file"
            id="fileInput"
            className={styles.fileInput}
            onChange={handleFileChange}
            accept=".xlsx"
          />
          <p>
            Drag & drop or <span>Click to Browse</span>
          </p>
        </div>
      </div>

      {file && (
        <div className={styles.fileList}>
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
          </div>
        </div>
      )}

      <Button
        size="md"
        variant={ButtonVariant.PRIMARY}
        onClick={handleSubmit}
        disabled={isUploading || !file}
        text={isUploading ? 'UPLOADING...' : 'CONFIRM UPLOAD'}
      />

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
    </div>
  );
};

export default ExcelUploader;
