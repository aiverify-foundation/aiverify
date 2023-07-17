import { IconButton } from 'src/components/iconButton';
import { TextInput } from 'src/components/textInput';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import styles from './styles/newModelApiConfig.module.css';
import { ChangeEvent } from 'react';
import { SelectInput, SelectOption } from 'src/components/selectInput';
import { optionsOpenApiDataTypes } from './selectOptions';

type BodyPayloadProperty = {
  key: string;
  dataType: string;
};

type BodyPayloadPropertyDisplayInputProps = {
  property: BodyPayloadProperty;
  onPropertyNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDatatypeChange: (option: SelectOption) => void;
  onRemoveBtnClick: (property: BodyPayloadProperty) => void;
};

type BodyPayloadPropertyCaptureInputProps = {
  newProperty: BodyPayloadProperty;
  onKeynameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDatatypeChange: (option: SelectOption) => void;
  onAddClick: () => void;
};

function BodyPayloadPropertyInputHeading() {
  return (
    <div style={{ display: 'flex', marginBottom: 4 }}>
      <div className={styles.headingName}>Property Name</div>
      <div className={styles.headingVal}>Data Type</div>
    </div>
  );
}

function BodyPayloadPropertyDisplayInput(
  props: BodyPayloadPropertyDisplayInputProps
) {
  const { property, onRemoveBtnClick, onPropertyNameChange, onDatatypeChange } =
    props;
  const selectedOption = optionsOpenApiDataTypes.find(
    (type) => type.value === property.dataType
  );

  function handleRemoveBtnClick(property: BodyPayloadProperty) {
    return () => onRemoveBtnClick(property);
  }

  return (
    <div className={styles.keyValRow}>
      <div className={styles.keyValCol}>
        <TextInput
          value={property.key}
          name="variableName"
          onChange={onPropertyNameChange}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.keyValCol}>
        <SelectInput
          name="propDataType"
          options={optionsOpenApiDataTypes}
          onChange={onDatatypeChange}
          value={selectedOption}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.delIconContainer}>
        <IconButton
          iconComponent={CloseIcon}
          noOutline
          onClick={handleRemoveBtnClick(property)}
          style={{ marginRight: 42 }}
        />
      </div>
    </div>
  );
}

function BodyPayloadPropertyCaptureInput(
  props: BodyPayloadPropertyCaptureInputProps
) {
  const { newProperty, onKeynameChange, onDatatypeChange, onAddClick } = props;
  const selectedOption = optionsOpenApiDataTypes.find(
    (type) => type.value === newProperty.dataType
  );
  const disableAddBtn = newProperty.key.trim() === '';
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div className={styles.keyInput}>
        <TextInput
          name=""
          onChange={onKeynameChange}
          value={newProperty.key}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.valInput}>
        <SelectInput
          name="propDataType"
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

export {
  BodyPayloadPropertyDisplayInput,
  BodyPayloadPropertyCaptureInput,
  BodyPayloadPropertyInputHeading,
};
export type { BodyPayloadProperty };
