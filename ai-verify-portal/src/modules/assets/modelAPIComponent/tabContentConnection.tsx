import { useFormikContext } from 'formik';
import { BatchStrategy, ModelApiFormModel } from './types';
import { TextInput } from 'src/components/textInput';
import styles from './styles/newModelApiConfig.module.css';
import { SelectInput } from 'src/components/selectInput';
import { optionsBatchStrategies } from './selectOptions';
import { ConnectionSettingUnlimited } from './constants';

const otherReqConfigFieldName = 'modelAPI.requestConfig';

function TabContentConnection({ disabled = false }: { disabled?: boolean }) {
  const { values, errors, touched, handleChange } =
    useFormikContext<ModelApiFormModel>();
  const requestConfig = values.modelAPI.requestConfig;
  const fieldErrors = errors.modelAPI?.requestConfig;
  const touchedFields = touched.modelAPI?.requestConfig;

  return (
    <div style={{ display: 'flex', gap: 50 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 300,
        }}>
        <div className={styles.keyValRow} style={{ marginBottom: 8 }}>
          <TextInput
            disabled={disabled}
            label="Request Timeout"
            name={`${otherReqConfigFieldName}.requestTimeout`}
            onChange={handleChange}
            value={requestConfig.requestTimeout}
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
        <div className={styles.keyValRow} style={{ marginBottom: 8 }}>
          <TextInput
            disabled={disabled}
            label="Rate Limit"
            name={`${otherReqConfigFieldName}.rateLimit`}
            onChange={handleChange}
            value={requestConfig.rateLimit}
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
          <TextInput
            disabled={
              disabled || requestConfig.rateLimit === ConnectionSettingUnlimited
            }
            label="Rate Limit Timeout"
            name={`${otherReqConfigFieldName}.rateLimitTimeout`}
            onChange={handleChange}
            value={requestConfig.rateLimitTimeout}
            maxLength={128}
            style={{ marginBottom: 0, width: '100%' }}
            error={
              Boolean(
                fieldErrors?.rateLimitTimeout && touchedFields?.rateLimitTimeout
              )
                ? fieldErrors?.rateLimitTimeout
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
            onSyntheticChange={handleChange}
            value={requestConfig.batchStrategy}
            style={{ marginBottom: 0, width: '100%' }}
          />
        </div>
        <div className={styles.keyValRow} style={{ marginBottom: 8 }}>
          <TextInput
            disabled={
              disabled || requestConfig.batchStrategy === BatchStrategy.none
            }
            label="Batch Limit"
            name={`${otherReqConfigFieldName}.batchLimit`}
            onChange={handleChange}
            value={requestConfig.batchLimit}
            maxLength={128}
            style={{ marginBottom: 0, width: '100%' }}
            error={
              Boolean(fieldErrors?.batchLimit && touchedFields?.batchLimit)
                ? fieldErrors?.batchLimit
                : undefined
            }
          />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', width: 300 }}>
        <div className={styles.keyValRow} style={{ marginBottom: 8 }}>
          <TextInput
            disabled={disabled}
            label="Connection Retries"
            name={`${otherReqConfigFieldName}.connectionRetries`}
            onChange={handleChange}
            value={requestConfig.connectionRetries}
            maxLength={128}
            style={{ marginBottom: 0, width: '100%' }}
            error={
              Boolean(
                fieldErrors?.connectionRetries &&
                  touchedFields?.connectionRetries
              )
                ? fieldErrors?.connectionRetries
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
            value={requestConfig.maxConnections}
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
      </div>
    </div>
  );
}

export { TabContentConnection };
