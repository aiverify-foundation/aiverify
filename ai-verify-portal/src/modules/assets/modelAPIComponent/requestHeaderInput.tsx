import { IconButton } from 'src/components/iconButton';
import { TextInput } from 'src/components/textInput';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import styles from './styles/newModelApiConfig.module.css';
import { ChangeEvent } from 'react';
import { AdditionalHeader, OpenApiDataTypes } from './types';
import { SelectInput } from 'src/components/selectInput';
import { optionsOpenApiDataTypes } from './selectOptions';

type AdditionalHeaderInputProps = {
  isFormikBinded?: boolean;
  value: AdditionalHeader;
  showAddBtn?: boolean;
  disabled?: boolean;
  headerError?: string;
  typeError?: string;
  valueError?: string;
  headerInputName?: string;
  headerTypeName?: string;
  headerValueName?: string;
  onChange: {
    (e: ChangeEvent<HTMLInputElement>): void;
    (value: AdditionalHeader): void;
  };
  onAddClick?: () => void;
  onDeleteClick?: (param: AdditionalHeader) => void;
};

function AdditionalHeaderInputHeading() {
  return (
    <div style={{ display: 'flex', marginBottom: 4 }}>
      <div className={styles.headingName}>Header Name</div>
      <div className={styles.headingName}>Data Type</div>
      <div className={styles.headingName}>Value</div>
      <div style={{ width: 72 }}></div>
    </div>
  );
}

function AdditionalHeaderInput(props: AdditionalHeaderInputProps) {
  const {
    isFormikBinded = false,
    value,
    showAddBtn = false,
    disabled,
    headerError,
    typeError,
    valueError,
    headerInputName,
    headerTypeName,
    headerValueName,
    onChange,
    onAddClick,
    onDeleteClick,
  } = props;
  const disableAddBtn =
    value.name.trim() === '' ||
    value.type.trim() === '' ||
    value.value.trim() === '';

  function handleRemoveBtnClick(header: AdditionalHeader) {
    return () => onDeleteClick && onDeleteClick(header);
  }

  function handleNameChange(e: ChangeEvent<HTMLInputElement>) {
    const updatedParam: AdditionalHeader = { ...value, name: e.target.value };
    onChange(updatedParam);
  }

  function handleTypeChange(val: OpenApiDataTypes) {
    const updatedParam = { ...value, type: val };
    onChange(updatedParam);
  }

  function handleValChange(e: ChangeEvent<HTMLInputElement>) {
    const updatedParam = { ...value, value: e.target.value };
    onChange(updatedParam);
  }

  return (
    <div className={styles.keyValRow}>
      <div className={styles.keyValCol}>
        <TextInput
          disabled={disabled}
          value={value.name}
          name={
            isFormikBinded && headerInputName
              ? headerInputName
              : 'headerNameInput'
          }
          style={{ marginBottom: 0 }}
          maxLength={100}
          onChange={isFormikBinded ? onChange : handleNameChange}
          error={headerError}
        />
      </div>
      <div className={styles.keyValCol}>
        <SelectInput<OpenApiDataTypes>
          disabled={disabled}
          name={
            isFormikBinded && headerTypeName
              ? headerTypeName
              : 'headerTypeInput'
          }
          options={optionsOpenApiDataTypes}
          onChange={isFormikBinded ? undefined : handleTypeChange}
          onSyntheticChange={isFormikBinded ? onChange : undefined}
          value={value.type}
          style={{ marginBottom: 0 }}
          error={typeError}
        />
      </div>
      <div className={styles.keyValCol}>
        <TextInput
          disabled={disabled}
          value={value.value}
          name={
            isFormikBinded && headerValueName
              ? headerValueName
              : 'headerValueInput'
          }
          style={{ marginBottom: 0 }}
          maxLength={100}
          onChange={isFormikBinded ? onChange : handleValChange}
          error={valueError}
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
        </div>
      ) : null}
    </div>
  );
}

export { AdditionalHeaderInput, AdditionalHeaderInputHeading };
