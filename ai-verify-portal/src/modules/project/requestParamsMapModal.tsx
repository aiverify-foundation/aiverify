import {
  AlertBox,
  AlertBoxFixedPositions,
  AlertBoxSize,
} from 'src/components/alertBox';
import { DatasetColumn } from 'src/types/dataset.interface';
import { BodyParam, UrlParam } from '../assets/modelAPIComponent/types';
import styles from './styles/requestParamsMapModal.module.css';
import { SelectInput, SelectOption } from 'src/components/selectInput';

type RequestParamsMapModalProps = {
  datasetColumns: DatasetColumn[];
  requestParams: (BodyParam | UrlParam)[];
  onCloseClick: () => void;
  onOkClick: () => void;
};

function RequestParamsMapModal(props: RequestParamsMapModalProps) {
  const { datasetColumns, requestParams, onCloseClick, onOkClick } = props;
  const datasetColumnOptions: SelectOption[] = datasetColumns.map((column) => ({
    value: column.name,
    label: column.name,
  }));
  console.log(datasetColumns);
  console.log(requestParams);
  return (
    <AlertBox
      size={AlertBoxSize.AUTO}
      renderInPortal
      enableModalOverlay
      fixedPosition={AlertBoxFixedPositions.CENTER}
      onCloseIconClick={onCloseClick}>
      <AlertBox.Header heading="API Request Parameters Mapping" />
      <AlertBox.Body hasFooter>
        <div
          style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <div
            className={styles.mapRow}
            style={{ fontWeight: 600, paddingBottom: 10 }}>
            <div className={styles.paramCell}>Request Parameters</div>
            <div className={styles.datasetCell}>Dataset Columns</div>
          </div>
          {requestParams.map((param) => (
            <div
              className={styles.mapRow}
              key={`param-${'name' in param ? param.name : param.field}`}>
              {'name' in param ? (
                <div className={styles.paramCell}>{param.name}</div>
              ) : (
                <div className={styles.paramCell} key={`param-${param.field}`}>
                  {param.field}
                </div>
              )}
              <div className={styles.datasetCell}>
                <SelectInput
                  name="dsetColumn"
                  options={datasetColumnOptions}
                  width={180}
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>
          ))}
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
            onClick={onOkClick}>
            OK
          </button>
        </div>
      </AlertBox.Footer>
    </AlertBox>
  );
}

export { RequestParamsMapModal };
