import { SelectInput } from 'src/components/selectInput';
import { optionsAuthMethods } from './selectOptions';
import { useFormikContext } from 'formik';
import { AuthType, ModelApiFormModel } from './types';
import { TextInput } from 'src/components/textInput';
import { useEffect } from 'react';
import { useFormGuide } from './providers/formGuideProvider';
import { ColorPalette } from 'src/components/colorPalette';
import { Tooltip, TooltipPosition } from 'src/components/tooltip';

const authTypeFieldName = 'modelAPI.authType';
const authTypeConfigFieldName = 'modelAPI.authTypeConfig';

function TabContentAuth({ disabled = false }: { disabled?: boolean }) {
  const { values, errors, touched, setFieldValue, handleChange } =
    useFormikContext<ModelApiFormModel>();
  const { inputFieldsDisabledStatus, highlightedFields } = useFormGuide();

  const fieldErrors = errors.modelAPI?.authTypeConfig;
  const touchedFields = touched.modelAPI?.authTypeConfig;

  useEffect(() => {
    setFieldValue(
      `${authTypeConfigFieldName}.authType`, // This is duplicated under authTypeConfig only for Yup validation field dependencies
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
        disabled={disabled || inputFieldsDisabledStatus[authTypeFieldName]}
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
            value={values.modelAPI.authTypeConfig.token}
            onChange={handleChange}
            style={{ width: 560 }}
            error={
              Boolean(fieldErrors?.token && touchedFields?.token)
                ? fieldErrors?.token
                : undefined
            }
            inputStyle={
              highlightedFields[`${authTypeConfigFieldName}.token`]
                ? {
                    border: `1px solid ${ColorPalette.gray}`,
                    backgroundColor: ColorPalette.softPurpleTint,
                  }
                : undefined
            }
          />
        </div>
      ) : null}
      {values.modelAPI.authType === AuthType.BASIC ? (
        <div style={{ display: 'flex' }}>
          {/* <Tooltip
            defaultShow={highlightedFields['username`']}
            disabled
            backgroundColor={ColorPalette.gray}
            fontColor={ColorPalette.white}
            content={
              <div style={{ marginBottom: 5, textAlign: 'left' }}>
                Add all data keynames that are required by the API to do the
                prediction.
              </div>
            }
            position={TooltipPosition.left}
            offsetLeft={-10}
            offsetTop={15}>
            <div> */}
          <TextInput
            disabled={disabled}
            label="Username"
            name={`${authTypeConfigFieldName}.username`}
            value={values.modelAPI.authTypeConfig.username}
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
            inputStyle={
              highlightedFields[`${authTypeConfigFieldName}.username`]
                ? {
                    border: `1px solid ${ColorPalette.gray}`,
                    backgroundColor: ColorPalette.softPurpleTint,
                  }
                : undefined
            }
          />
          {/* </div>
          </Tooltip> */}
          <TextInput
            disabled={disabled}
            label="Password"
            name={`${authTypeConfigFieldName}.password`}
            value={values.modelAPI.authTypeConfig.password}
            onChange={handleChange}
            style={{ width: 300 }}
            error={
              Boolean(fieldErrors?.password && touchedFields?.password)
                ? fieldErrors?.password
                : undefined
            }
            inputStyle={
              highlightedFields[`${authTypeConfigFieldName}.password`]
                ? {
                    border: `1px solid ${ColorPalette.gray}`,
                    backgroundColor: ColorPalette.softPurpleTint,
                  }
                : undefined
            }
          />
        </div>
      ) : null}
    </div>
  );
}

export { TabContentAuth };
