import { AdditionalHeader, ModelAPIFormModel, OpenApiDataTypes } from './types';
import { FieldArray, FieldArrayRenderProps, useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
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

const additionalHeaderFieldName = 'modelAPI.additionalHeaders';

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
      setFieldValue(`${additionalHeaderFieldName}[${idx}]`, val);
    };
  }

  function handleAddNewHeader(formikArrayHelpers: FieldArrayRenderProps) {
    return () => {
      formikArrayHelpers.push(newHeader);
      setNewHeader(defaultAdditionalHeader);
    };
  }

  useEffect(() => {
    if (values.modelAPI.additionalHeaders?.length === 0) {
      setFieldValue(additionalHeaderFieldName, undefined);
    }
  }, [values.modelAPI.additionalHeaders]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}>
      <div>
        <AdditionalHeaderInputHeading />
        <FieldArray name={additionalHeaderFieldName}>
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
                  onAddClick={handleAddNewHeader(arrayHelpers)}
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
