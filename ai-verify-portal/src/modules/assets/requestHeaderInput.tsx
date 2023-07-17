import { IconButton } from 'src/components/iconButton';
import { TextInput } from 'src/components/textInput';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import styles from './styles/newModelApiConfig.module.css';
import { ChangeEvent } from 'react';

type RequestHeader = {
  key: string;
  value: string;
};

type RequestHeaderDisplayProps = {
  header: RequestHeader;
  onKeynameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onValueChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveBtnClick: (globalVar: RequestHeader) => void;
};

type RequestHeaderCaptureInputProps = {
  newHeader: RequestHeader;
  onKeynameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onValueChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onAddClick: () => void;
};

function RequestHeaderInputHeading() {
  return (
    <div style={{ display: 'flex', marginBottom: 4 }}>
      <div className={styles.headingName}>Header Name</div>
      <div className={styles.headingVal}>Value</div>
      <div></div>
    </div>
  );
}

function RequestHeaderDisplayInput(props: RequestHeaderDisplayProps) {
  const { header, onRemoveBtnClick, onKeynameChange, onValueChange } = props;

  function handleRemoveBtnClick(header: RequestHeader) {
    return () => onRemoveBtnClick(header);
  }

  return (
    <div id={`varkey-${header.key}`} className={styles.keyValRow}>
      <div className={styles.keyValCol}>
        <TextInput
          value={header.key}
          name=""
          style={{ marginBottom: 0 }}
          onChange={onKeynameChange}
        />
      </div>
      <div className={styles.keyValCol}>
        <TextInput
          value={header.value}
          name=""
          style={{ marginBottom: 0 }}
          onChange={onValueChange}
        />
      </div>
      <div className={styles.delIconContainer}>
        <IconButton
          iconComponent={CloseIcon}
          noOutline
          onClick={handleRemoveBtnClick(header)}
        />
      </div>
    </div>
  );
}

function RequestHeaderCaptureInput(props: RequestHeaderCaptureInputProps) {
  const { newHeader, onKeynameChange, onValueChange, onAddClick } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div className={styles.keyInput}>
        <TextInput
          name="headerKeyNameCapture"
          onChange={onKeynameChange}
          value={newHeader.key}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.valInput}>
        <TextInput
          name="headerValueCapture"
          onChange={onValueChange}
          value={newHeader.value}
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
  RequestHeaderDisplayInput,
  RequestHeaderCaptureInput,
  RequestHeaderInputHeading,
};
export type { RequestHeader };
