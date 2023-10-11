import { SelectInput } from 'src/components/selectInput';
import {
  BodyParam,
  MediaType,
  ModelApiFormModel,
  OpenApiDataTypes,
} from './types';
import {
  FieldArray,
  FieldArrayRenderProps,
  useFormikContext,
  FormikErrors,
  FormikTouched,
} from 'formik';
import { optionsMediaTypes } from './selectOptions';
import { ChangeEvent, useState } from 'react';
import { getInputReactKeyId } from '.';
import {
  RequestBodyParameterInput,
  RequestBodyParamsHeading,
} from './requestBodyParamInput';
import { CheckBox } from 'src/components/checkbox';
import { TextInput } from 'src/components/textInput';
import { ColorPalette } from 'src/components/colorPalette';

const defaultBodyParameter: BodyParam = {
  reactPropId: '',
  field: '',
  type: OpenApiDataTypes.INTEGER,
};

const requestBodyFieldName = 'modelAPI.requestBody';

const PropExistsMsg = 'Property exists';
const RequiredMsg = 'Required';

function TabContentRequestBody({ disabled = false }: { disabled: boolean }) {
  const [newParam, setNewParam] = useState<BodyParam>(defaultBodyParameter);
  const [errorMsg, setErrorMsg] = useState<string>();
  const { values, errors, touched, handleChange } =
    useFormikContext<ModelApiFormModel>();
  const requestBody = values.modelAPI.requestBody;
  const properties = requestBody?.properties || [];
  const fieldErrors = errors.modelAPI?.requestBody?.properties as
    | FormikErrors<BodyParam>[]
    | string
    | undefined;
  const touchedFields = touched.modelAPI?.requestBody?.properties as
    | FormikTouched<BodyParam>[]
    | undefined;
  const mediaTypeOptions = [
    optionsMediaTypes[1],
    optionsMediaTypes[2],
    optionsMediaTypes[3],
  ];

  // overloading just to make the type compatible with formik's `handleChange` signature
  function handleNewParamChange(e: ChangeEvent<HTMLInputElement>): void;
  function handleNewParamChange(arg: BodyParam): void;
  function handleNewParamChange(
    arg: BodyParam | ChangeEvent<HTMLInputElement>
  ) {
    if ('field' in arg) {
      if (errorMsg !== undefined) setErrorMsg(undefined);
      setNewParam((prev) => ({
        ...arg,
        reactPropId:
          prev.reactPropId === '' ? getInputReactKeyId() : prev.reactPropId,
      }));
    }
  }

  function handleAddClick(formikArrayHelpers: FieldArrayRenderProps) {
    return () => {
      if (newParam.field.trim() === '') setErrorMsg(RequiredMsg);
      if (!requestBody) return;
      const isExist =
        requestBody.properties && // 👈TODO - double check
        requestBody.properties.findIndex(
          (prop) => prop.field === newParam.field
        ) > -1;
      if (isExist) {
        setErrorMsg(PropExistsMsg);
        return;
      }
      formikArrayHelpers.push(newParam);
      setNewParam(defaultBodyParameter);
    };
  }

  function handleDeleteClick(
    formikArrayHelpers: FieldArrayRenderProps,
    index: number
  ) {
    return () => {
      if (requestBody?.properties[index].field === newParam.field) {
        setErrorMsg(undefined);
      }
      formikArrayHelpers.remove(index);
    };
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}>
      <SelectInput<MediaType>
        disabled={disabled}
        width={240}
        label="Media Type"
        name={`${requestBodyFieldName}.mediaType`}
        options={mediaTypeOptions}
        value={requestBody?.mediaType}
        onSyntheticChange={handleChange}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          marginBottom: 15,
        }}>
        <CheckBox
          label="Format as array"
          disabled={disabled}
          checked={requestBody?.isArray}
          name={`${requestBodyFieldName}.isArray`}
          onChange={handleChange}
          style={{ marginBottom: 15 }}
        />
        {requestBody && requestBody.isArray ? (
          <div style={{ display: 'flex' }}>
            {requestBody.mediaType === MediaType.FORM_URLENCODED ? (
              <TextInput
                label="Array Variable Name"
                disabled={disabled || !requestBody?.isArray}
                name={`${requestBodyFieldName}.name`}
                onChange={handleChange}
                value={requestBody?.name}
                maxLength={128}
                style={{ marginBottom: 0, marginRight: 8, width: 200 }}
              />
            ) : null}
            <TextInput
              label="Max Items"
              disabled={disabled || !requestBody?.isArray}
              name={`${requestBodyFieldName}.maxItems`}
              onChange={handleChange}
              value={requestBody?.maxItems}
              maxLength={128}
              style={{ marginBottom: 0, marginRight: 8, width: 200 }}
            />
          </div>
        ) : null}
      </div>
      {requestBody?.mediaType !== MediaType.NONE ? (
        <>
          {disabled && !properties.length ? null : <RequestBodyParamsHeading />}
          <FieldArray name={`${requestBodyFieldName}.properties`}>
            {(arrayHelpers) => (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                {disabled && !properties.length ? (
                  <div style={{ fontSize: 15, marginTop: 20 }}>
                    No Request Body Properties
                  </div>
                ) : (
                  properties.map((param, index) => (
                    <RequestBodyParameterInput
                      isFormikBinded
                      propInputName={`modelAPI.requestBody.properties.${index}.field`}
                      propTypeName={`modelAPI.requestBody.properties.${index}.type`}
                      disabled={disabled}
                      key={param.reactPropId}
                      value={param}
                      onChange={handleChange}
                      onDeleteClick={handleDeleteClick(arrayHelpers, index)}
                      fieldError={
                        Boolean(
                          fieldErrors &&
                            typeof fieldErrors === 'object' &&
                            fieldErrors[index]?.field &&
                            touchedFields &&
                            touchedFields[index]?.field
                        )
                          ? fieldErrors && fieldErrors[index]?.field
                          : undefined
                      }
                    />
                  ))
                )}
                {!disabled ? (
                  <div style={{ marginTop: 8 }}>
                    <RequestBodyParameterInput
                      showAddBtn
                      value={newParam}
                      onChange={handleNewParamChange}
                      onAddClick={handleAddClick(arrayHelpers)}
                      fieldError={errorMsg}
                    />
                    {Object.keys(touched).length &&
                    typeof fieldErrors === 'string' ? (
                      <div
                        style={{ color: ColorPalette.alertRed, fontSize: 14 }}>
                        {fieldErrors}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </FieldArray>
        </>
      ) : null}
    </div>
  );
}

export { TabContentRequestBody };
