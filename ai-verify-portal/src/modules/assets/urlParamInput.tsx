import { IconButton } from 'src/components/iconButton';
import { TextInput } from 'src/components/textInput';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import styles from './styles/newModelApiConfig.module.css';
import { ChangeEvent } from 'react';

type UrlParameter = {
  key: string;
  dataType: string;
};

type UrlParamsDisplayProps = {
  param: UrlParameter;
  onRemoveBtnClick: (param: UrlParameter) => void;
};

type UrlParamCaptureInputProps = {
  newParam: UrlParameter;
  onKeynameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDatatypeChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onAddClick: () => void;
};

function UrlParamsInputHeading() {
  return (
    <div style={{ display: 'flex', marginBottom: 4 }}>
      <div className={styles.headingName}>Parameter Name</div>
      <div className={styles.headingVal}>Data Type</div>
    </div>
  );
}

function UrlParamDisplayInput(props: UrlParamsDisplayProps) {
  const { param, onRemoveBtnClick } = props;

  function handleRemoveBtnClick(param: UrlParameter) {
    return () => onRemoveBtnClick(param);
  }

  return (
    <div id={`varkey-${param.key}`} className={styles.keyValRow}>
      <div className={styles.keyValCol}>
        <TextInput
          value={param.key}
          name="variableName"
          style={{ marginBottom: 4 }}
        />
      </div>
      <div className={styles.keyValCol}>
        <TextInput
          value={param.dataType}
          name="dataType"
          style={{ marginBottom: 4 }}
        />
      </div>
      <div className={styles.delIconContainer}>
        <IconButton
          iconComponent={CloseIcon}
          noOutline
          onClick={handleRemoveBtnClick(param)}
          style={{ marginRight: 42 }}
        />
      </div>
    </div>
  );
}

function UrlParamCaptureInput(props: UrlParamCaptureInputProps) {
  const { newParam, onKeynameChange, onDatatypeChange, onAddClick } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div className={styles.keyInput}>
        <TextInput
          name=""
          onChange={onKeynameChange}
          value={newParam.key}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.valInput}>
        <TextInput
          name=""
          onChange={onDatatypeChange}
          value={newParam.dataType}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.iconContainer}>
        <IconButton iconComponent={AddIcon} onClick={onAddClick}>
          <div
            style={{
              color: '#676767',
              fontSize: 15,
              margin: '0 6px',
            }}>
            Add
          </div>
        </IconButton>
      </div>
    </div>
  );
}

export { UrlParamDisplayInput, UrlParamCaptureInput, UrlParamsInputHeading };
export type { UrlParameter };
