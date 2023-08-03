import {
  AlertBox,
  AlertBoxFixedPositions,
  AlertBoxSize,
} from 'src/components/alertBox';
import { DatasetColumn } from 'src/types/dataset.interface';
import { BodyParam, UrlParam } from '../assets/modelAPIComponent/types';
import styles from './styles/requestParamsMapModal.module.css';
import { SelectInput, SelectOption } from 'src/components/selectInput';
import { ChangeEvent, useEffect, useState } from 'react';
import produce from 'immer';
import { TextInput } from 'src/components/textInput';

type RequestParamsMapModalProps = {
  initialMap?: Record<string, string>;
  datasetColumns: DatasetColumn[];
  requestParams: BodyParam[] | UrlParam[];
  onCloseClick: () => void;
  onOkClick: (paramsColumnsMap: Record<string, string>) => void;
};

function RequestParamsMapModal(props: RequestParamsMapModalProps) {
  const { initialMap, datasetColumns, requestParams, onCloseClick, onOkClick } =
    props;
  const columnDict: Record<string, string> = {}; // used for easy lookup of column name using param name
  const columnOptions: SelectOption[] | undefined = datasetColumns.length
    ? datasetColumns.map((column) => {
        columnDict[column.name] = column.name;
        return {
          value: column.name,
          label: column.name,
        };
      })
    : undefined;
  const [paramsColumnsMap, setParamsColumnsMap] = useState<
    Record<string, string>
  >({});

  function handleColumnSelectChange(paramName: string) {
    return (columnName: string) =>
      setParamsColumnsMap(
        produce((draft) => {
          draft[paramName] = columnName;
        })
      );
  }

  function handleColumnTextChange(paramName: string) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setParamsColumnsMap(
        produce((draft) => {
          draft[paramName] = e.target.value;
        })
      );
  }

  function handleOkClick() {
    onOkClick(paramsColumnsMap);
  }

  useEffect(() => {
    let newMap: Record<string, string> = {};
    requestParams.forEach((param) => {
      const name = 'name' in param ? param.name : param.field;
      newMap[name] = columnDict[name] || '';
    });
    if (initialMap !== undefined) {
      newMap = { ...newMap, ...initialMap };
    }
    setParamsColumnsMap(newMap);
  }, [initialMap]);

  return (
    <AlertBox
      size={AlertBoxSize.MEDIUM}
      renderInPortal
      enableModalOverlay
      fixedPosition={AlertBoxFixedPositions.CENTER}
      onCloseIconClick={onCloseClick}>
      <AlertBox.Header heading="API Request Parameters Mapping" />
      <AlertBox.Body
        hasFooter
        bodyStyles={{
          padding: 0,
        }}>
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
          <div
            className={styles.mapRow}
            style={{
              fontWeight: 600,
              paddingBottom: 10,
              height: 'auto',
            }}>
            <div className={styles.paramCell}>Request Parameters</div>
            <div className={styles.datasetCell}>Dataset Columns</div>
          </div>
          {requestParams.map((param) => {
            const name = 'name' in param ? param.name : param.field;
            return (
              <div className={styles.mapRow} key={`param-${name}`}>
                <div className={styles.paramCell}>{name}</div>
                <div className={styles.datasetCell}>
                  {columnOptions ? (
                    <SelectInput
                      name="dsetColumn"
                      options={columnOptions}
                      width={180}
                      value={paramsColumnsMap[name]}
                      style={{ marginBottom: 0 }}
                      onChange={handleColumnSelectChange(name)}
                    />
                  ) : (
                    <TextInput
                      name="dsetColumn"
                      value={paramsColumnsMap[name]}
                      style={{ marginBottom: 0, width: 180 }}
                      onChange={handleColumnTextChange(name)}
                    />
                  )}
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex' }}></div>
        </div>
      </AlertBox.Body>
      <AlertBox.Footer>
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
          <button
            className="aivBase-button aivBase-button--primary aivBase-button--small"
            onClick={handleOkClick}>
            OK
          </button>
        </div>
      </AlertBox.Footer>
    </AlertBox>
  );
}

export { RequestParamsMapModal };
