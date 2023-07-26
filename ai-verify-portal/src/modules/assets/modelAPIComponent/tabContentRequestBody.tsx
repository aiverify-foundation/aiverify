import { SelectInput } from 'src/components/selectInput';
import {
  BodyParam,
  MediaType,
  ModelAPIFormModel,
  OpenApiDataTypes,
} from './types';
import { FieldArray, useFormikContext } from 'formik';
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

function TabContentRequestBody({ disabled = false }: { disabled: boolean }) {
  const [newParam, setNewParam] = useState<BodyParam>(defaultBodyParameter);
  const { values, setFieldValue, handleChange } =
    useFormikContext<ModelAPIFormModel>();
  const properties = values.modelAPI.requestBody.properties || [];

  function handleNewParamChange(value: BodyParam) {
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
          {properties.length > 0 ? <RequestBodyParamsHeading /> : null}
          <FieldArray name={`${requestBodyFieldName}.properties`}>
            {(arrayHelpers) => (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                {!properties.length ? (
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
                      onDeleteClick={() => arrayHelpers.remove(index)}
                    />
                  ))
                )}
                {!disabled ? (
                  <RequestBodyParameterInput
                    showAddBtn
                    value={newParam}
                    onChange={handleNewParamChange}
                    onAddClick={() => {
                      arrayHelpers.push(newParam);
                      setNewParam(defaultBodyParameter);
                    }}
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
