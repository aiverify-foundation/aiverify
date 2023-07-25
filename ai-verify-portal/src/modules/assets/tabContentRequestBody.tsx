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
import { getInputReactKeyId } from './newModelApiConfig';
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

function TabContentRequestBody() {
  const [newParam, setNewParam] = useState<BodyParam>(defaultBodyParameter);
  const { values, setFieldValue } = useFormikContext<ModelAPIFormModel>();

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
        width={240}
        label="Media Type"
        name="requestBody.mediaType"
        options={optionsMediaTypes}
        value={values.modelAPI.requestBody?.mediaType}
        onChange={(val) =>
          setFieldValue(`${requestBodyFieldName}.mediaType`, val)
        }
      />
      {values.modelAPI.requestBody.mediaType !== MediaType.NONE ? (
        <>
          <RequestBodyParamsHeading />
          <FieldArray name={`${requestBodyFieldName}.properties`}>
            {(arrayHelpers) => {
              const params = values.modelAPI.requestBody.properties || [];
              return (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                  {params.map((param, index) => (
                    <RequestBodyParameterInput
                      key={param.reactPropId}
                      value={param}
                      onChange={handleAddedParamChange(index)}
                      onDeleteClick={() => arrayHelpers.remove(index)}
                    />
                  ))}
                  <RequestBodyParameterInput
                    showAddBtn
                    value={newParam}
                    onChange={handleNewParamChange}
                    onAddClick={() => {
                      arrayHelpers.push(newParam);
                      setNewParam(defaultBodyParameter);
                    }}
                  />
                </div>
              );
            }}
          </FieldArray>
        </>
      ) : null}
    </div>
  );
}

export { TabContentRequestBody };
