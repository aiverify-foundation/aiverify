import { IconButton } from 'src/components/iconButton';
import { TextInput } from 'src/components/textInput';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import styles from './styles/newModelApiConfig.module.css';
import { ChangeEvent } from 'react';
import { SelectInput, SelectOption } from 'src/components/selectInput';
import { optionsOpenApiDataTypes } from './selectOptions';

type UrlParameter = {
  key: string;
  dataType: string;
};

type UrlParamsDisplayProps = {
  param: UrlParameter;
  onKeynameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDatatypeChange: (option: SelectOption) => void;
  onRemoveBtnClick: (param: UrlParameter) => void;
};

type UrlParamCaptureInputProps = {
  newParam: UrlParameter;
  onKeynameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDatatypeChange: (option: SelectOption) => void;
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
  const { param, onRemoveBtnClick, onKeynameChange, onDatatypeChange } = props;
  const selectedOption = optionsOpenApiDataTypes.find(
    (type) => type.value === param.dataType
  );

  function handleRemoveBtnClick(param: UrlParameter) {
    return () => onRemoveBtnClick(param);
  }

  return (
    <div className={styles.keyValRow}>
      <div className={styles.keyValCol}>
        <TextInput
          value={param.key}
          name="variableName"
          style={{ marginBottom: 0 }}
          maxLength={100}
          onChange={onKeynameChange}
        />
      </div>
      <div className={styles.keyValCol}>
        <SelectInput
          name="paramDataType"
          options={optionsOpenApiDataTypes}
          onChange={onDatatypeChange}
          value={selectedOption}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.delIconContainer}>
        <div style={{ display: 'flex' }}>
          <DragIndicatorIcon style={{ color: '#cfcfcf', cursor: 'move' }} />
        </div>
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
  const selectedOption = optionsOpenApiDataTypes.find(
    (type) => type.value === newParam.dataType
  );
  const disableAddBtn = newParam.key.trim() == '';

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div className={styles.keyInput}>
        <TextInput
          name="paramName"
          onChange={onKeynameChange}
          value={newParam.key}
          maxLength={100}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.valInput}>
        <SelectInput
          name="paramDataType"
          options={optionsOpenApiDataTypes}
          onChange={onDatatypeChange}
          value={selectedOption}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.iconContainer}>
        <IconButton
          iconComponent={AddIcon}
          onClick={onAddClick}
          disabled={disableAddBtn}>
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
