import { AdditionalHeader, ModelAPIFormModel, OpenApiDataTypes } from './types';
import { FieldArray, useFormikContext } from 'formik';
import { useState } from 'react';
import { getInputReactKeyId } from './newModelApiConfig';
import {
  AdditionalHeaderInput,
  AdditionalHeaderInputHeading,
} from './requestHeaderInput';

const defaultAdditionalHeader: AdditionalHeader = {
  reactPropId: '',
  name: '',
  type: OpenApiDataTypes.INTEGER,
  value: '',
};

function TabContentAdditionalHeaders() {
  const [newHeader, setNewHeader] = useState<AdditionalHeader>(
    defaultAdditionalHeader
  );
  const { values, setFieldValue } = useFormikContext<ModelAPIFormModel>();

  function handleNewParamChange(value: AdditionalHeader) {
    setNewHeader((prev) => ({
      ...value,
      reactPropId:
        prev.reactPropId === '' ? getInputReactKeyId() : prev.reactPropId,
    }));
  }

  function handleAddedParamChange(idx: number) {
    return (val: AdditionalHeader) => {
      setFieldValue(`additionalHeaders[${idx}]`, val);
    };
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}>
      <div>
        <AdditionalHeaderInputHeading />
        <FieldArray name="additionalHeaders">
          {(arrayHelpers) => {
            const headers = values.modelAPI.additionalHeaders || [];
            return (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 'fit-content',
                }}>
                {headers.map((header, index) => (
                  <AdditionalHeaderInput
                    key={header.reactPropId}
                    value={header}
                    onChange={handleAddedParamChange(index)}
                    onDeleteClick={() => arrayHelpers.remove(index)}
                  />
                ))}
                <AdditionalHeaderInput
                  showAddBtn
                  value={newHeader}
                  onChange={handleNewParamChange}
                  onAddClick={() => {
                    arrayHelpers.push(newHeader);
                    setNewHeader(defaultAdditionalHeader);
                  }}
                />
              </div>
            );
          }}
        </FieldArray>
      </div>
    </div>
  );
}

export { TabContentAdditionalHeaders };
