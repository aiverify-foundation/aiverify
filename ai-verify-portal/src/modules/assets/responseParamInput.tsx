import { ChangeEvent } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { TextInput } from 'src/components/textInput';
import { IconButton } from 'src/components/iconButton';
import styles from './styles/newModelApiConfig.module.css';
import { MediaType, OpenApiDataTypes, Response } from './types';
import { SelectInput } from 'src/components/selectInput';
import { optionsMediaTypes, optionsOpenApiDataTypes } from './selectOptions';

type ResponseInputProps = {
  showAddBtn?: boolean;
  value: Response;
  onChange: (value: Response) => void;
  onAddClick?: () => void;
  onDeleteClick?: (param: Response) => void;
};

function ResponseInputHeading() {
  return (
    <div style={{ display: 'flex', marginBottom: 4 }}>
      <div className={styles.headingName} style={{ width: 90 }}>
        Status Code
      </div>
      <div className={styles.headingVal}>Media Type</div>
      <div className={styles.headingVal}>Data Type</div>
      <div className={styles.headingVal}>Field Name</div>
      <div></div>
    </div>
  );
}

function ResponsePropertyInput(props: ResponseInputProps) {
  const {
    value,
    showAddBtn = false,
    onChange,
    onAddClick,
    onDeleteClick,
  } = props;

  const disableAddBtn =
    showAddBtn &&
    (!value.statusCode ||
      value.mediaType.trim() === '' ||
      value.type.trim() === '');

  function handleRemoveBtnClick(response: Response) {
    return () => onDeleteClick && onDeleteClick(response);
  }

  function handleStatusCodeChange(e: ChangeEvent<HTMLInputElement>) {
    const updatedParam: Response = {
      ...value,
      statusCode: parseInt(e.target.value),
    };
    onChange(updatedParam);
  }

  function handleMediaChange(val: MediaType) {
    const updatedParam: Response = { ...value, mediaType: val };
    onChange(updatedParam);
  }

  function handleTypeChange(val: OpenApiDataTypes) {
    const updatedParam = { ...value, type: val };
    onChange(updatedParam);
  }

  function handleFieldChange(e: ChangeEvent<HTMLInputElement>) {
    const updatedParam = { ...value, field: e.target.value };
    onChange(updatedParam);
  }

  return (
    <div className={styles.keyValRow}>
      <div className={styles.keyValCol} style={{ width: 90 }}>
        <TextInput
          name="statusCodeInput"
          onChange={handleStatusCodeChange}
          value={value.statusCode.toString()}
          maxLength={128}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.keyValCol}>
        <SelectInput<MediaType>
          name="mediaTypeInput"
          options={optionsMediaTypes}
          onChange={handleMediaChange}
          value={value.mediaType}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.keyValCol}>
        <SelectInput<OpenApiDataTypes>
          name="dataTypeInput"
          options={optionsOpenApiDataTypes}
          onChange={handleTypeChange}
          value={value.type}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.keyValCol}>
        <TextInput
          name="fieldNameInput"
          onChange={handleFieldChange}
          value={value.field}
          maxLength={128}
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
      ) : null}
      {onDeleteClick ? (
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

export { ResponseInputHeading, ResponsePropertyInput };
