import { SelectInput } from 'src/components/selectInput';
import {
  BodyParam,
  MediaType,
  ModelAPIFormModel,
  OpenApiDataTypes,
} from './types';
import { FieldArray, FieldArrayRenderProps, useFormikContext } from 'formik';
import { optionsMediaTypes } from './selectOptions';
import { useState } from 'react';
import { getInputReactKeyId } from '.';
import {
  RequestBodyParameterInput,
  RequestBodyParamsHeading,
} from './requestBodyParamInput';

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
  const { values, setFieldValue, handleChange } =
    useFormikContext<ModelAPIFormModel>();
  const properties = values.modelAPI.requestBody.properties || [];

  function handleNewParamChange(value: BodyParam) {
    if (errorMsg !== undefined) setErrorMsg(undefined);
    setNewParam((prev) => ({
      ...value,
      reactPropId:
        prev.reactPropId === '' ? getInputReactKeyId() : prev.reactPropId,
    }));
  }

  function handleAddedParamChange(idx: number) {
    return (val: BodyParam) => {
      setFieldValue(`${requestBodyFieldName}.properties[${idx}]`, val);
    };
  }

  function handleAddClick(formikArrayHelpers: FieldArrayRenderProps) {
    return () => {
      if (newParam.field.trim() === '') setErrorMsg(RequiredMsg);
      const isExist =
        values.modelAPI.requestBody.properties.findIndex(
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
      if (
        values.modelAPI.requestBody.properties[index].field === newParam.field
      ) {
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
        options={optionsMediaTypes}
        value={values.modelAPI.requestBody?.mediaType}
        onSyntheticChange={handleChange}
      />
      {values.modelAPI.requestBody.mediaType !== MediaType.NONE ? (
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
                      disabled={disabled}
                      key={param.reactPropId}
                      value={param}
                      onChange={handleAddedParamChange(index)}
                      onDeleteClick={handleDeleteClick(arrayHelpers, index)}
                    />
                  ))
                )}
                {!disabled ? (
                  <RequestBodyParameterInput
                    showAddBtn
                    value={newParam}
                    onChange={handleNewParamChange}
                    onAddClick={handleAddClick(arrayHelpers)}
                    fieldError={errorMsg}
                  />
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
