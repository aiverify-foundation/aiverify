import { ChangeEvent } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { TextInput } from 'src/components/textInput';
import { IconButton } from 'src/components/iconButton';
import styles from './styles/newModelApiConfig.module.css';

type ResponseProperty = {
  key: string;
  value: string;
};

type ResponsePropertyInputProps = {
  showAddBtn?: boolean;
  property: ResponseProperty;
  onKeynameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onValueChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onAddClick?: () => void;
  onRemoveBtnClick?: (globalVar: ResponseProperty) => void;
};

function ResponsePropertyInputHeading() {
  return (
    <div style={{ display: 'flex', marginBottom: 4 }}>
      <div className={styles.headingName}>Property Name</div>
      <div className={styles.headingVal}>Value</div>
      <div></div>
    </div>
  );
}

function ResponsePropertyInput(props: ResponsePropertyInputProps) {
  const {
    property,
    showAddBtn = false,
    onKeynameChange,
    onValueChange,
    onAddClick,
    onRemoveBtnClick,
  } = props;

  const disableAddBtn =
    showAddBtn && (property.key.trim() === '' || property.value.trim() === '');

  function handleRemoveBtnClick(property: ResponseProperty) {
    return () => {
      if (onRemoveBtnClick) onRemoveBtnClick(property);
    };
  }

  return (
    <div className={styles.keyValRow}>
      <div className={styles.keyValCol}>
        <TextInput
          name="propertyNameCapture"
          onChange={onKeynameChange}
          value={property.key}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.keyValCol}>
        <TextInput
          name="propertyValueCapture"
          onChange={onValueChange}
          value={property.value}
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
      ) : (
        <div className={styles.delIconContainer}>
          <IconButton
            iconComponent={CloseIcon}
            noOutline
            onClick={handleRemoveBtnClick(property)}
          />
        </div>
      )}
    </div>
  );
}

export { ResponsePropertyInputHeading, ResponsePropertyInput };
export type { ResponseProperty };
