import { IconButton } from 'src/components/iconButton';
import { TextInput } from 'src/components/textInput';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import styles from './styles/newModelApiConfig.module.css';
import { ChangeEvent } from 'react';
import { SelectInput } from 'src/components/selectInput';
import { optionsOpenApiDataTypes } from './selectOptions';
import { OpenApiDataTypes, UrlParam } from './types';

type UrlParameterInputProps = {
  value: UrlParam;
  showAddBtn?: boolean;
  disabled?: boolean;
  onChange: (value: UrlParam) => void;
  onAddClick?: () => void;
  onDeleteClick?: (param: UrlParam) => void;
};

function UrlParamsInputHeading() {
  return (
    <div style={{ display: 'flex', marginBottom: 4 }}>
      <div className={styles.headingName}>Parameter Name</div>
      <div className={styles.headingVal}>Data Type</div>
    </div>
  );
}

function UrlParamCaptureInput(props: UrlParameterInputProps) {
  const {
    value,
    showAddBtn = false,
    disabled = false,
    onChange,
    onAddClick,
    onDeleteClick,
  } = props;
  const disableAddBtn = value.name.trim() === '' || value.type.trim() === '';

  function handleRemoveBtnClick(param: UrlParam) {
    return () => onDeleteClick && onDeleteClick(param);
  }

  function handleKeyChange(e: ChangeEvent<HTMLInputElement>) {
    const updatedParam: UrlParam = { ...value, name: e.target.value };
    onChange(updatedParam);
  }

  function handleTypeChange(val: OpenApiDataTypes) {
    const updatedParam = { ...value, type: val };
    onChange(updatedParam);
  }

  return (
    <div className={styles.keyValRow}>
      <div className={styles.keyValCol}>
        <TextInput
          disabled={disabled}
          value={value.name}
          name="paramName"
          style={{ marginBottom: 0 }}
          maxLength={100}
          onChange={handleKeyChange}
        />
      </div>
      <div className={styles.keyValCol}>
        <SelectInput<OpenApiDataTypes>
          disabled={disabled}
          name="paramDataType"
          options={optionsOpenApiDataTypes}
          onChange={handleTypeChange}
          value={value.type}
          style={{ marginBottom: 0 }}
        />
      </div>
      {showAddBtn ? (
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
      ) : !disabled ? (
        <div className={styles.delIconContainer}>
          <IconButton
            iconComponent={CloseIcon}
            noOutline
            onClick={handleRemoveBtnClick(value)}
          />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <DragIndicatorIcon style={{ color: '#cfcfcf', cursor: 'grab' }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { UrlParamCaptureInput, UrlParamsInputHeading };