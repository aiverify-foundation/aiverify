import { SelectInput } from 'src/components/selectInput';
import { optionsAuthMethods } from './selectOptions';
import { useFormikContext } from 'formik';
import {
  AuthBasicConfig,
  AuthBearerTokenConfig,
  AuthType,
  ModelAPIFormModel,
} from './types';
import { TextInput } from 'src/components/textInput';
import { ChangeEvent, useEffect } from 'react';

const authTypeFieldName = 'modelAPI.authType';
const authTypeConfigFieldName = 'modelAPI.authTypeConfig';

function TabContentAuth({ disabled = false }: { disabled?: boolean }) {
  const { values, errors, touched, setFieldValue, handleChange } =
    useFormikContext<ModelAPIFormModel>();

  // investigate authTypeConfig type-check not working
  const fieldErrors = errors.modelAPI?.authTypeConfig as any;
  const touchedFields = touched.modelAPI?.authTypeConfig as any;

  function handleBearerTokenChange(e: ChangeEvent<HTMLInputElement>) {
    setFieldValue(`${authTypeConfigFieldName}.token`, e.target.value);
  }

  useEffect(() => {
    setFieldValue(
      `${authTypeConfigFieldName}.authType`, // This is set under authTypeConfig only for Yup validation field dependencies
      values.modelAPI.authType
    );
  }, [values.modelAPI.authType]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}>
      <SelectInput<AuthType>
        disabled={disabled}
        width={200}
        label="Authentication Type"
        name={authTypeFieldName}
        options={optionsAuthMethods}
        onSyntheticChange={handleChange}
        value={values.modelAPI.authType}
      />
      {values.modelAPI.authType === AuthType.BEARER_TOKEN ? (
        <div style={{ flexGrow: 1 }}>
          <TextInput
            disabled={disabled}
            label="Token"
            name={`${authTypeConfigFieldName}.token`}
            value={
              (values.modelAPI.authTypeConfig as AuthBearerTokenConfig)?.token
            }
            onChange={handleBearerTokenChange}
            style={{ width: 560 }}
            error={
              Boolean(fieldErrors?.token && touchedFields?.token)
                ? fieldErrors?.token
                : undefined
            }
          />
        </div>
      ) : null}
      {values.modelAPI.authType === AuthType.BASIC ? (
        <div style={{ display: 'flex' }}>
          <TextInput
            disabled={disabled}
            label="Username"
            name={`${authTypeConfigFieldName}.username`}
            value={
              (values.modelAPI.authTypeConfig as AuthBasicConfig)?.username
            }
            onChange={handleChange}
            style={{
              marginRight: 8,
              width: 300,
            }}
            error={
              Boolean(fieldErrors?.username && touchedFields?.username)
                ? fieldErrors?.username
                : undefined
            }
          />
          <TextInput
            disabled={disabled}
            label="Password"
            name={`${authTypeConfigFieldName}.password`}
            value={
              (values.modelAPI.authTypeConfig as AuthBasicConfig)?.password
            }
            onChange={handleChange}
            style={{ width: 300 }}
            error={
              Boolean(fieldErrors?.password && touchedFields?.password)
                ? fieldErrors?.password
                : undefined
            }
          />
        </div>
      ) : null}
    </div>
  );
}

export { TabContentAuth };
