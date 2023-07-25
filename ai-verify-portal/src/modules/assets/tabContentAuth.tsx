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

function TabContentAuth() {
  const { values, setFieldValue, handleChange } =
    useFormikContext<ModelAPIFormModel>();

  function handleBearerTokenChange(e: ChangeEvent<HTMLInputElement>) {
    setFieldValue(`${authTypeConfigFieldName}.token`, e.target.value);
  }

  useEffect(() => {
    switch (values.modelAPI.authType) {
      case AuthType.NO_AUTH:
        setFieldValue(authTypeConfigFieldName, undefined);
        break;
      case AuthType.BASIC:
        setFieldValue(`${authTypeConfigFieldName}.token`, undefined);
        break;
      case AuthType.BEARER_TOKEN:
        setFieldValue(`${authTypeConfigFieldName}.username`, undefined);
        setFieldValue(`${authTypeConfigFieldName}.password`, undefined);
        break;
    }
  }, [values.modelAPI.authType]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}>
      <SelectInput<AuthType>
        width={200}
        label="Authentication Type"
        name="authTypeInput"
        options={optionsAuthMethods}
        onChange={(val) => setFieldValue(authTypeFieldName, val)}
        value={values.modelAPI.authType}
      />
      {values.modelAPI.authType === AuthType.BEARER_TOKEN ? (
        <div style={{ flexGrow: 1 }}>
          <TextInput
            label="Token"
            name={`${authTypeConfigFieldName}.token`}
            value={
              (values.modelAPI.authTypeConfig as AuthBearerTokenConfig)?.token
            }
            onChange={handleBearerTokenChange}
            style={{ width: 560 }}
          />
        </div>
      ) : null}
      {values.modelAPI.authType === AuthType.BASIC ? (
        <div style={{ display: 'flex' }}>
          <TextInput
            label="User"
            name={`${authTypeConfigFieldName}.username`}
            value={
              (values.modelAPI.authTypeConfig as AuthBasicConfig)?.username
            }
            onChange={handleChange}
            style={{
              marginRight: 8,
              width: 300,
            }}
          />
          <TextInput
            label="Password"
            name={`${authTypeConfigFieldName}.password`}
            value={(values.modelAPI.authTypeConfig as AuthBasicConfig).password}
            onChange={handleChange}
            style={{ width: 300 }}
          />
        </div>
      ) : null}
    </div>
  );
}

export { TabContentAuth };
