import { IconButton } from 'src/components/iconButton';
import { TextInput } from 'src/components/textInput';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import styles from './styles/newModelApiConfig.module.css';
import { ChangeEvent } from 'react';

type BodyPayloadProperty = {
  key: string;
  dataType: string;
};

type BodyPayloadPropertyDisplayInputProps = {
  property: BodyPayloadProperty;
  onRemoveBtnClick: (property: BodyPayloadProperty) => void;
};

type BodyPayloadPropertyCaptureInputProps = {
  newProperty: BodyPayloadProperty;
  onKeynameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDatatypeChange: (e: ChangeEvent<HTMLInputElement>) => void;
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
  const { property, onRemoveBtnClick } = props;

  function handleRemoveBtnClick(property: BodyPayloadProperty) {
    return () => onRemoveBtnClick(property);
  }

  return (
    <div id={`varkey-${property.key}`} className={styles.keyValRow}>
      <div className={styles.keyValCol}>
        <TextInput
          value={property.key}
          name="variableName"
          style={{ marginBottom: 4 }}
        />
      </div>
      <div className={styles.keyValCol}>
        <TextInput
          value={property.dataType}
          name="dataType"
          style={{ marginBottom: 4 }}
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
        <TextInput
          name=""
          onChange={onDatatypeChange}
          value={newProperty.dataType}
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

export {
  BodyPayloadPropertyDisplayInput,
  BodyPayloadPropertyCaptureInput,
  BodyPayloadPropertyInputHeading,
};
export type { BodyPayloadProperty };
