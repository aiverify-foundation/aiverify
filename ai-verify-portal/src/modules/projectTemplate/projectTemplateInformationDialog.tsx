import React, { useState } from 'react';
import Button from '@mui/material/Button';
import { ProjectInformation } from 'src/types/projectTemplate.interface';
import { ProjectTemplateStore } from './projectTemplateContext';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // TODO - use other svg and remove dependency on Material icons
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MyTextField from 'src/components/myTextField';
import {
  AlertBox,
  AlertBoxFixedPositions,
  AlertBoxSize,
} from 'src/components/alertBox';
import styles from './styles/dialogs.module.css';

type ProjectTemplateInformationDialogProps = {
  projectStore: ProjectTemplateStore;
  onClose: () => void;
};

export default function ProjectTemplateInformationDialog(
  props: ProjectTemplateInformationDialogProps
) {
  const { projectStore, onClose } = props;
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [templateDetails, setTemplateDetails] = useState<ProjectInformation>({
    name: `${projectStore.projectInfo.name} Template`,
    description: projectStore.projectInfo.description,
    company: projectStore.projectInfo.company,
  });

  const onChange = (key: string, value: string) => {
    setTemplateDetails((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  function handleInputChange(inputName: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(inputName, e.target.value);
  }

  async function handleSaveAsTemplate() {
    try {
      const id = await projectStore.saveProjectAsTemplate(templateDetails);
      if (id) {
        setShowSuccess(true);
      } else {
        setShowError(true);
      }
    } catch (err) {
      setShowSuccess(false);
      setShowError(true);
      console.error('Error saving canvas as template', err);
    }
  }

  return (
    <AlertBox
      enableModalOverlay
      size={AlertBoxSize.MEDIUM}
      fixedPosition={AlertBoxFixedPositions.CENTER}
      onCloseIconClick={onClose}>
      <AlertBox.Header heading="Save as Project Template" />
      <AlertBox.Body hasFooter>
        {showSuccess ? (
          <div className={styles.resultBody}>
            <div className={styles.iconWrapper}>
              <CheckCircleOutlineIcon className={styles.successIcon} />
            </div>
            <div className={styles.resultContent}>
              <div className={styles.successHeading}>Save Successful</div>
              <div>
                Design has been saved as a template. It will appear on Templates
                screen.
              </div>
            </div>
          </div>
        ) : null}
        {showError ? (
          <div className={styles.resultBody}>
            <div className={styles.iconWrapper}>
              <ErrorOutlineIcon className={styles.errorIcon} />
            </div>
            <div className={styles.resultContent}>
              <div className={styles.errorHeading}>Save Unsuccessful</div>
              <div>There was a problem saving this design as a template.</div>
            </div>
          </div>
        ) : null}
        {!showSuccess && !showError ? (
          <div>
            <MyTextField
              id="input-name"
              title="Template Name"
              inputProps={{
                required: true,
                error: templateDetails.name.length == 0,
                onChange: handleInputChange('name'),
                value: templateDetails.name,
                placeholder: 'Enter Template Name',
                styles: {
                  outline: 'none',
                },
              }}
              errorText={
                templateDetails.name.length == 0
                  ? 'Template name is required'
                  : null
              }
              FormControlProps={{
                sx: { mb: 2 },
              }}
            />
            <MyTextField
              id="input-description"
              title="Description"
              inputProps={{
                multiline: true,
                minRows: 4,
                onChange: handleInputChange('description'),
                value: templateDetails.description,
                placeholder: 'Enter Template Description',
              }}
              FormControlProps={{
                sx: { mb: 2 },
              }}
            />
            <MyTextField
              id="input-author-name"
              title="Author"
              inputProps={{
                multiline: true,
                onChange: handleInputChange('company'),
                value: templateDetails.company,
                placeholder: 'Enter Author Name',
              }}
            />
          </div>
        ) : null}
      </AlertBox.Body>
      <AlertBox.Footer>
        {!showSuccess && !showError ? (
          <div className={styles.footerBtnContainer}>
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={handleSaveAsTemplate}>Save</Button>
          </div>
        ) : (
          <div className={styles.footerBtnContainer}>
            <Button onClick={onClose}>OK</Button>
          </div>
        )}
      </AlertBox.Footer>
    </AlertBox>
  );
}
