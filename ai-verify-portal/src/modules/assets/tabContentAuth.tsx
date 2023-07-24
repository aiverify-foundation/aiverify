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
import { ChangeEvent } from 'react';

function TabContentAuth() {
  const { values, setFieldValue } = useFormikContext<ModelAPIFormModel>();

  function handleBearerTokenChange(e: ChangeEvent<HTMLInputElement>) {
    setFieldValue('authTypeConfig.token', e.target.value);
  }
  function handleUsernameChange(e: ChangeEvent<HTMLInputElement>) {
    setFieldValue('authTypeConfig.username', e.target.value);
  }
  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setFieldValue('authTypeConfig.password', e.target.value);
  }
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
        onChange={(val) => setFieldValue('authType', val)}
        value={values.modelAPI.authType}
      />
      {values.modelAPI.authType === AuthType.BEARER_TOKEN ? (
        <div style={{ flexGrow: 1 }}>
          <TextInput
            label="Token"
            name="authTypeConfig.token"
            value={
              (values.modelAPI.authTypeConfig as AuthBearerTokenConfig).token
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
            name="authTypeConfig.username"
            value={(values.modelAPI.authTypeConfig as AuthBasicConfig).username}
            onChange={handleUsernameChange}
            style={{
              marginRight: 8,
              width: 300,
            }}
          />
          <TextInput
            label="Password"
            name="authTypeConfig.password"
            value={(values.modelAPI.authTypeConfig as AuthBasicConfig).password}
            onChange={handlePasswordChange}
            style={{ width: 300 }}
          />
        </div>
      ) : null}
    </div>
  );
}

export { TabContentAuth };
