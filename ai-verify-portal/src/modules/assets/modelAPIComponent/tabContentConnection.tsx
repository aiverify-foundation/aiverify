import { useFormikContext } from 'formik';
import { BatchStrategy, ModelApiFormModel } from './types';
import { TextInput } from 'src/components/textInput';
import styles from './styles/newModelApiConfig.module.css';
import { SelectInput } from 'src/components/selectInput';
import { optionsBatchStrategies } from './selectOptions';
import { Tooltip, TooltipPosition } from 'src/components/tooltip';
import InfoIcon from '@mui/icons-material/Info';
import { ColorPalette } from 'src/components/colorPalette';
import { CheckBox } from 'src/components/checkbox';

const otherReqConfigFieldName = 'modelAPI.requestConfig';

function TabContentConnection({ disabled = false }: { disabled?: boolean }) {
  const { values, errors, touched, handleChange } =
    useFormikContext<ModelApiFormModel>();
  const requestConfig = values.modelAPI.requestConfig;
  const fieldErrors = errors.modelAPI?.requestConfig;
  const touchedFields = touched.modelAPI?.requestConfig;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}>
      <div style={{ display: 'flex' }}>
        <CheckBox
          label="SSL Verify"
          disabled={disabled}
          checked={values.modelAPI.requestConfig.sslVerify}
          name={`${otherReqConfigFieldName}.sslVerify`}
          onChange={handleChange}
        />
        <Tooltip
          backgroundColor={ColorPalette.gray}
          fontColor={ColorPalette.white}
          content={
            <div style={{ marginBottom: 5 }}>
              Boolean to determine if there is a need to verify the SSL cert
              when connecting to the server.
            </div>
          }
          position={TooltipPosition.right}
          offsetLeft={8}>
          <InfoIcon
            style={{ fontSize: 18, color: ColorPalette.gray2, marginLeft: 15 }}
          />
        </Tooltip>
      </div>
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
              label="Connection Timeout (seconds)"
              name={`${otherReqConfigFieldName}.connectionTimeout`}
              onChange={handleChange}
              value={requestConfig.connectionTimeout}
              maxLength={128}
              style={{ marginBottom: 0, width: '100%' }}
              error={
                Boolean(
                  fieldErrors?.connectionTimeout &&
                    touchedFields?.connectionTimeout
                )
                  ? fieldErrors?.connectionTimeout
                  : undefined
              }
              labelSibling={
                <Tooltip
                  backgroundColor={ColorPalette.gray}
                  fontColor={ColorPalette.white}
                  content={
                    <div style={{ marginBottom: 5 }}>
                      The connection timeout when connecting to the server (in
                      seconds). Defaults to -1, which means the timeout is set
                      to httpx&lsquo;s default timeout.
                    </div>
                  }
                  position={TooltipPosition.right}
                  offsetLeft={8}>
                  <InfoIcon
                    style={{ fontSize: 18, color: ColorPalette.gray2 }}
                  />
                </Tooltip>
              }
            />
          </div>
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
              labelSibling={
                <Tooltip
                  backgroundColor={ColorPalette.gray}
                  fontColor={ColorPalette.white}
                  content={
                    <div style={{ marginBottom: 5 }}>
                      The number of retries for connecting to a server.
                    </div>
                  }
                  position={TooltipPosition.right}
                  offsetLeft={8}>
                  <InfoIcon
                    style={{ fontSize: 18, color: ColorPalette.gray2 }}
                  />
                </Tooltip>
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
              labelSibling={
                <Tooltip
                  backgroundColor={ColorPalette.gray}
                  fontColor={ColorPalette.white}
                  content={
                    <div style={{ marginBottom: 5 }}>
                      The maximum number of concurrent connection(s) that can be
                      made to the server. Defaults to -1, which means there is
                      no maximum number of connection(s).
                    </div>
                  }
                  position={TooltipPosition.right}
                  offsetLeft={8}>
                  <InfoIcon
                    style={{ fontSize: 18, color: ColorPalette.gray2 }}
                  />
                </Tooltip>
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
              labelSibling={
                <Tooltip
                  backgroundColor={ColorPalette.gray}
                  fontColor={ColorPalette.white}
                  content={
                    <div style={{ marginBottom: 5 }}>
                      The maximum number of request(s) allowed to be made to the
                      server per second. Defaults to -1, which means there is no
                      limit to the number of requests(s) made to the server.
                    </div>
                  }
                  position={TooltipPosition.right}
                  offsetLeft={8}>
                  <InfoIcon
                    style={{ fontSize: 18, color: ColorPalette.gray2 }}
                  />
                </Tooltip>
              }
            />
          </div>
          <div className={styles.keyValRow} style={{ marginBottom: 8 }}>
            <TextInput
              disabled={
                disabled ||
                requestConfig.rateLimit.trim() === '' ||
                parseInt(requestConfig.rateLimit) < 0
              }
              label="Rate Limit Timeout (seconds)"
              name={`${otherReqConfigFieldName}.rateLimitTimeout`}
              onChange={handleChange}
              value={requestConfig.rateLimitTimeout}
              maxLength={128}
              style={{ marginBottom: 0, width: '100%' }}
              error={
                Boolean(
                  fieldErrors?.rateLimitTimeout &&
                    touchedFields?.rateLimitTimeout
                )
                  ? fieldErrors?.rateLimitTimeout
                  : undefined
              }
              labelSibling={
                <Tooltip
                  backgroundColor={ColorPalette.gray}
                  fontColor={ColorPalette.white}
                  content={
                    <div style={{ marginBottom: 5 }}>
                      The connection timeout when connecting to the server(in
                      seconds) when there is rate limiting. Defaults to -1,
                      which means the timeout is set to httpx&lsquo;s default
                      timeout.
                    </div>
                  }
                  position={TooltipPosition.right}
                  offsetLeft={8}>
                  <InfoIcon
                    style={{ fontSize: 18, color: ColorPalette.gray2 }}
                  />
                </Tooltip>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { TabContentConnection };
