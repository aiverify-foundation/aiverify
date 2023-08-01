import { useFormikContext } from 'formik';
import { BatchStrategy, ModelAPIFormModel } from './types';
import { TextInput } from 'src/components/textInput';
import styles from './styles/newModelApiConfig.module.css';
import { SelectInput } from 'src/components/selectInput';
import { optionsBatchStrategies } from './selectOptions';

const otherReqConfigFieldName = 'modelAPI.requestConfig';

function TabContentOthers({ disabled = false }: { disabled?: boolean }) {
  const { values, errors, touched, setFieldValue, handleChange } =
    useFormikContext<ModelAPIFormModel>();

  const fieldErrors = errors.modelAPI?.requestConfig;
  const touchedFields = touched.modelAPI?.requestConfig;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 300,
      }}>
      <div className={styles.keyValRow} style={{ marginBottom: 8 }}>
        <TextInput
          disabled={disabled}
          label="Rate Limit"
          name={`${otherReqConfigFieldName}.rateLimit`}
          onChange={handleChange}
          value={values.modelAPI.requestConfig.rateLimit.toString()}
          maxLength={128}
          style={{ marginBottom: 0, width: '100%' }}
          error={
            Boolean(fieldErrors?.rateLimit && touchedFields?.rateLimit)
              ? fieldErrors?.rateLimit
              : undefined
          }
        />
      </div>
      <div className={styles.keyValRow} style={{ marginBottom: 8 }}>
        <SelectInput<BatchStrategy>
          disabled={disabled}
          label="Batch Strategy"
          name={`${otherReqConfigFieldName}.batchStrategy`}
          options={optionsBatchStrategies}
          onChange={(val) =>
            setFieldValue(`${otherReqConfigFieldName}.batchStrategy`, val)
          }
          value={values.modelAPI.requestConfig.batchStrategy}
          style={{ marginBottom: 0, width: '100%' }}
        />
      </div>
      <div className={styles.keyValRow} style={{ marginBottom: 8 }}>
        <TextInput
          disabled={disabled}
          label="Batch Limit"
          name={`${otherReqConfigFieldName}.batchLimit`}
          onChange={handleChange}
          value={values.modelAPI.requestConfig.batchLimit?.toString()}
          maxLength={128}
          style={{ marginBottom: 0, width: '100%' }}
          error={
            Boolean(fieldErrors?.batchLimit && touchedFields?.batchLimit)
              ? fieldErrors?.batchLimit
              : undefined
          }
        />
      </div>
      <div className={styles.keyValRow} style={{ marginBottom: 8 }}>
        <TextInput
          disabled={disabled}
          label="Max Connections"
          name={`${otherReqConfigFieldName}.maxConnections`}
          onChange={handleChange}
          value={values.modelAPI.requestConfig.maxConnections.toString()}
          maxLength={128}
          style={{ marginBottom: 0, width: '100%' }}
          error={
            Boolean(
              fieldErrors?.maxConnections && touchedFields?.maxConnections
            )
              ? fieldErrors?.maxConnections
              : undefined
          }
        />
      </div>
      <div className={styles.keyValRow} style={{ marginBottom: 8 }}>
        <TextInput
          disabled={disabled}
          label="Request Timeout"
          name={`${otherReqConfigFieldName}.requestTimeout`}
          onChange={handleChange}
          value={values.modelAPI.requestConfig.requestTimeout.toString()}
          maxLength={128}
          style={{ marginBottom: 0, width: '100%' }}
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
