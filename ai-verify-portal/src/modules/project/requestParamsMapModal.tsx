import {
  AlertBox,
  AlertBoxFixedPositions,
  AlertBoxSize,
} from 'src/components/alertBox';
import { DatasetColumn } from 'src/types/dataset.interface';
import { BodyParam, UrlParam } from '../assets/modelAPIComponent/types';
import styles from './styles/requestParamsMapModal.module.css';
import { SelectInput, SelectOption } from 'src/components/selectInput';
import { useEffect, useState } from 'react';
import produce from 'immer';

type RequestParamsMapModalProps = {
  initialMap?: Record<string, string>;
  datasetColumns: DatasetColumn[];
  requestParams: (BodyParam | UrlParam)[];
  onCloseClick: () => void;
  onOkClick: (paramsColumnsMapping: Record<string, string | undefined>) => void;
};

function RequestParamsMapModal(props: RequestParamsMapModalProps) {
  const { initialMap, datasetColumns, requestParams, onCloseClick, onOkClick } =
    props;
  const columnDict: Record<string, string> = {};
  const datasetColumnOptions: SelectOption[] = datasetColumns.map((column) => {
    columnDict[column.name] = column.name;
    return {
      value: column.name,
      label: column.name,
    };
  });
  const [paramsColumnsMapping, setParamsColumnsMapping] = useState<
    Record<string, string | undefined>
  >({});

  function handleColumnChange(paramName: string) {
    return (columnName: string) =>
      setParamsColumnsMapping(
        produce((draft) => {
          draft[paramName] = columnName;
        })
      );
  }

  function handleOkClick() {
    onOkClick(paramsColumnsMapping);
  }

  useEffect(() => {
    let newMap: Record<string, string | undefined> = {};
    requestParams.forEach((param) => {
      const name = 'name' in param ? param.name : param.field;
      newMap[name] = columnDict[name];
    });
    if (initialMap !== undefined) {
      newMap = { ...newMap, ...initialMap };
    }
    setParamsColumnsMapping(newMap);
  }, [initialMap]);

  useEffect(() => {
    console.log(paramsColumnsMapping);
  }, [paramsColumnsMapping]);
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
                  <SelectInput
                    name="dsetColumn"
                    options={datasetColumnOptions}
                    width={180}
                    value={paramsColumnsMapping[name]}
                    style={{ marginBottom: 0 }}
                    onChange={handleColumnChange(name)}
                  />
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
