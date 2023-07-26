import { AdditionalHeader, ModelAPIFormModel, OpenApiDataTypes } from './types';
import { FieldArray, FieldArrayRenderProps, useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
import { getInputReactKeyId } from '.';
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

function TabContentAdditionalHeaders({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const [newHeader, setNewHeader] = useState<AdditionalHeader>(
    defaultAdditionalHeader
  );
  const { values, setFieldValue } = useFormikContext<ModelAPIFormModel>();
  const headers = values.modelAPI.additionalHeaders || [];

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
    if (headers.length === 0) {
      setFieldValue(additionalHeaderFieldName, undefined);
    }
  }, [values.modelAPI.additionalHeaders]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}>
      {!disabled ? <AdditionalHeaderInputHeading /> : null}
      <FieldArray name={additionalHeaderFieldName}>
        {(arrayHelpers) => (
          <>
            {disabled && !headers.length ? (
              <div style={{ fontSize: 15, marginTop: 20 }}>
                No additional Request Headers
              </div>
            ) : (
              headers.map((header, index) => (
                <AdditionalHeaderInput
                  disabled={disabled}
                  key={header.reactPropId}
                  value={header}
                  onChange={handleAddedParamChange(index)}
                  onDeleteClick={() => arrayHelpers.remove(index)}
                />
              ))
            )}
            {!disabled ? (
              <AdditionalHeaderInput
                showAddBtn
                value={newHeader}
                onChange={handleNewParamChange}
                onAddClick={handleAddNewHeader(arrayHelpers)}
              />
            ) : null}
          </>
        )}
      </FieldArray>
    </div>
  );
}

export { TabContentAdditionalHeaders };
