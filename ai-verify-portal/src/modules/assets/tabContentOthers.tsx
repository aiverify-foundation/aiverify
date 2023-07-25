import { useFormikContext } from 'formik';
import { BatchStrategy, ModelAPIFormModel } from './types';
import { TextInput } from 'src/components/textInput';
import styles from './styles/newModelApiConfig.module.css';
import { SelectInput } from 'src/components/selectInput';
import { optionsBatchStrategies } from './selectOptions';

/*
 rateLimit: number;
  batchStrategy: BatchStrategy;
  batchLimit: number;
  maxConnections: number;
  requestTimeout: number;*/
const otherReqConfigFieldName = 'modelAPI.requestConfig';

function TabContentOthers() {
  const { values, errors, touched, setFieldValue, handleChange } =
    useFormikContext<ModelAPIFormModel>();

  const fieldErrors = errors.modelAPI?.requestConfig;
  const touchedFields = touched.modelAPI?.requestConfig;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
      }}>
      <div className={styles.keyValCol} style={{ width: 120 }}>
        <TextInput
          label="Rate Limit"
          name={`${otherReqConfigFieldName}.rateLimit`}
          onChange={handleChange}
          value={values.modelAPI.requestConfig.rateLimit.toString()}
          maxLength={128}
          style={{ marginBottom: 0 }}
          error={
            Boolean(fieldErrors?.rateLimit && touchedFields?.rateLimit)
              ? fieldErrors?.rateLimit
              : undefined
          }
        />
      </div>
      <div className={styles.keyValCol}>
        <SelectInput<BatchStrategy>
          label="Batch Strategy"
          name={`${otherReqConfigFieldName}.batchStrategy`}
          options={optionsBatchStrategies}
          onChange={(val) =>
            setFieldValue(`${otherReqConfigFieldName}.batchStrategy`, val)
          }
          value={values.modelAPI.requestConfig.batchStrategy}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.keyValCol} style={{ width: 120 }}>
        <TextInput
          label="Batch Limit"
          name={`${otherReqConfigFieldName}.batchLimit`}
          onChange={handleChange}
          value={values.modelAPI.requestConfig.batchLimit.toString()}
          maxLength={128}
          style={{ marginBottom: 0 }}
          error={
            Boolean(fieldErrors?.batchLimit && touchedFields?.batchLimit)
              ? fieldErrors?.batchLimit
              : undefined
          }
        />
      </div>
      <div className={styles.keyValCol} style={{ width: 120 }}>
        <TextInput
          label="Max Connections"
          name={`${otherReqConfigFieldName}.maxConnections`}
          onChange={handleChange}
          value={values.modelAPI.requestConfig.maxConnections.toString()}
          maxLength={128}
          style={{ marginBottom: 0 }}
          error={
            Boolean(
              fieldErrors?.maxConnections && touchedFields?.maxConnections
            )
              ? fieldErrors?.maxConnections
              : undefined
          }
        />
      </div>
      <div className={styles.keyValCol} style={{ width: 120 }}>
        <TextInput
          label="Request Timeout"
          name={`${otherReqConfigFieldName}.requestTimeout`}
          onChange={handleChange}
          value={values.modelAPI.requestConfig.requestTimeout.toString()}
          maxLength={128}
          style={{ marginBottom: 0 }}
          error={
            Boolean(
              fieldErrors?.requestTimeout && touchedFields?.requestTimeout
            )
              ? fieldErrors?.requestTimeout
              : undefined
          }
        />
      </div>
    </div>
  );
}

export { TabContentOthers };
