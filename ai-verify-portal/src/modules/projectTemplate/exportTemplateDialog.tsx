import React, { useState } from 'react';
import Button from '@mui/material/Button';
import { v4 as uuidv4 } from 'uuid';
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

type ExportTemplateDialogProps = {
  projectStore: ProjectTemplateStore,
  onClose: () => void;
}

export default function ExportTemplateDialog(props: ExportTemplateDialogProps) {
  const { projectStore, onClose } = props;
  const [ showSuccess, setShowSuccess ] = useState(false);
  const [ showError, setShowError ] = useState(false);
  const [ pluginGID, setPluginGID ] = useState(uuidv4());
  const [ templateCID, setTemplateCID ] = useState(projectStore.projectInfo.name.toLowerCase().replaceAll(/[^a-z0-9]/g,"-"));

  async function handleExport() {
    if (pluginGID.trim().length == 0 || templateCID.trim().length == 0)
    //TODO - field level error
      return;
    try {
      const response = await projectStore.exportTemplate(pluginGID.trim(), templateCID.trim());
      if (response === 'ok') {
        setShowSuccess(true);
      } else {
        setShowError(true);
      }
    } catch(err) {
      setShowError(true);
      console.error('Error exporting canvas as template', err);
    }
  }

  function handleGidInputChange(e:React.ChangeEvent<HTMLInputElement>) {
    setPluginGID(e.target.value);
  }

  function handleCidInputChange(e:React.ChangeEvent<HTMLInputElement>) {
    setTemplateCID(e.target.value);
  }

  return (
    <AlertBox
      enableModalOverlay
      size={AlertBoxSize.MEDIUM}
      fixedPosition={AlertBoxFixedPositions.CENTER}
      onCloseIconClick={onClose}>
      <AlertBox.Header heading="Export as Plugin" />
      <AlertBox.Body hasFooter>
        {showSuccess ?
          <div className={styles.resultBody}>
            <div className={styles.iconWrapper}>
              <CheckCircleOutlineIcon className={styles.successIcon} />
            </div>
            <div className={styles.resultContent}>
              <div className={styles.successHeading}>Export Successful</div>
              <div>Design has been exported as template plugin.</div>
            </div>
          </div> : null 
        }
        {showError ?
          <div className={styles.resultBody}>
            <div className={styles.iconWrapper}>
              <ErrorOutlineIcon className={styles.errorIcon} />
            </div>
            <div className={styles.resultContent}>
              <div className={styles.errorHeading}>Export Unsuccessful</div>
              <div>There was a problem exporting this design as a template plugin.</div>
            </div>
          </div> : null 
        }
        {(!showSuccess && !showError) ?
          <div>
            <MyTextField
              id='input-pluginGID'
              title="Plugin GID"
              description="Provide a unique Plugin Global Identifier"
              inputProps={{
                required: true,
                error: (pluginGID.length === 0),
                onChange: handleGidInputChange,
                value: pluginGID,
                placeholder: "Enter Plugin GID",
              }}
              errorText={pluginGID.length === 0 ? "Plugin GID is required" : null}
              FormControlProps={{
                sx: {mb:2}
              }}
            />
            <MyTextField
              id='input-templateCID'
              title="Template CID"
              description="Provide a unqiue component ID within the plugin"
              inputProps={{
                required: true,
                error: (templateCID.length === 0),
                onChange: handleCidInputChange,
                value: templateCID,
                placeholder: "Enter Template GID",
              }}
              errorText={templateCID.length === 0 ? "Template GID is required" : null}
              FormControlProps={{
                sx: {mb:2}
              }}
            />
          </div> : null
        }
      </AlertBox.Body>
      <AlertBox.Footer>
        {(!showSuccess && !showError) ? 
          <div className={styles.footerBtnContainer}>
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={handleExport}>Export</Button>
          </div> : 
          <div className={styles.footerBtnContainer}>
            <Button onClick={onClose}>OK</Button>
          </div>
        }
      </AlertBox.Footer>
    </AlertBox>
  )
}