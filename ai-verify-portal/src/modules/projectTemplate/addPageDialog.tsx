import React, { useState } from 'react';
import Button from '@mui/material/Button';
import NativeSelect from '@mui/material/NativeSelect';
import { ProjectTemplateStore } from './projectTemplateContext';
import {
  AlertBox,
  AlertBoxFixedPositions,
  AlertBoxSize,
} from 'src/components/alertBox';
import styles from './styles/dialogs.module.css';

type AddPageDialogProps = {
  projectStore: ProjectTemplateStore;
  onCancel: () => void;
  onAddPage: (pageAdded: number) => void;
};

export default function AddPageDialog(props: AddPageDialogProps) {
  const { projectStore, onCancel, onAddPage } = props;
  const [selected, setSelected] = useState<string>('append');
  const [pagePosition, setPagePosition] = useState<number>(0);

  const onChangeSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelected(event.target.value);
  };

  const handleAddPage = () => {
    // const numPage = projectStore.pages.length;
    switch (selected) {
      case 'append':
        onAddPage(-1);
        break;
      case 'insert0':
        onAddPage(0);
        break;
      case 'insert':
        onAddPage(pagePosition + 1);
        break;
    }
  };

  return (
    <AlertBox
      enableModalOverlay
      size={AlertBoxSize.SMALL}
      fixedPosition={AlertBoxFixedPositions.CENTER}
      onCloseIconClick={onCancel}>
      <AlertBox.Header heading="Add Page" />
      <AlertBox.Body hasFooter>
        Where to add page?
        <div style={{ marginTop: '5px' }}>
          <input
            type="radio"
            id="afterLastPage"
            name="insertPage"
            value="append"
            onChange={onChangeSelection}
            checked={selected === 'append'}
          />
          <label htmlFor="afterLastPage">After Last Page</label>
          <br />
          <input
            type="radio"
            id="beforeFirstPage"
            name="insertPage"
            value="insert0"
            onChange={onChangeSelection}
            checked={selected === 'insert0'}
          />
          <label htmlFor="beforeFirstPage">Before First Page</label>
          <br />
          <input
            type="radio"
            id="atPagePosition"
            name="insertPage"
            value="insert"
            onChange={onChangeSelection}
            checked={selected === 'insert'}
          />
          <label htmlFor="javascript">After Page:</label>&nbsp;
          <NativeSelect
            id="insertPagePosition"
            disabled={!selected || selected !== 'insert'}
            style={{ width: '60px' }}
            value={pagePosition}
            onChange={(event) => setPagePosition(parseInt(event.target.value))}>
            {[...Array(projectStore.pages.length)].map((obj, index) => (
              <option key={`select-page-${index}`} value={index}>
                {index + 1}
              </option>
            ))}
          </NativeSelect>
        </div>
      </AlertBox.Body>
      <AlertBox.Footer>
        <div className={styles.footerBtnContainer}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={handleAddPage}>Add Page</Button>
        </div>
      </AlertBox.Footer>
    </AlertBox>
  );
}
