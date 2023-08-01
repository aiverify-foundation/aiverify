import { AdditionalHeader, ModelAPIFormModel, OpenApiDataTypes } from './types';
import { FieldArray, FieldArrayRenderProps, useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
import { getInputReactKeyId } from '.';
import {
  AdditionalHeaderInput,
  AdditionalHeaderInputHeading,
} from './requestHeaderInput';

const HeaderExistsMsg = 'Header exists';
const RequiredMsg = 'Required';

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
  const [headerErrorMsg, setHeaderErrorMsg] = useState<string>();
  const [valueErrorMsg, setValueErrorMsg] = useState<string>();
  const { values, setFieldValue } = useFormikContext<ModelAPIFormModel>();
  const headers = values.modelAPI.additionalHeaders || [];

  function handleNewParamChange(value: AdditionalHeader) {
    if (headerErrorMsg !== undefined) setHeaderErrorMsg(undefined);
    if (valueErrorMsg !== undefined) setValueErrorMsg(undefined);
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
      if (newHeader.name.trim() === '') setHeaderErrorMsg(RequiredMsg);
      const isExist =
        headers &&
        headers.findIndex((header) => header.name === newHeader.name) > -1;
      if (isExist) {
        setHeaderErrorMsg(HeaderExistsMsg);
        return;
      }
      formikArrayHelpers.push(newHeader);
      setNewHeader(defaultAdditionalHeader);
    };
  }

  function handleDeleteClick(
    formikArrayHelpers: FieldArrayRenderProps,
    index: number
  ) {
    return () => {
      if (headers && headers[index].name === newHeader.name) {
        setHeaderErrorMsg(undefined);
      }
      formikArrayHelpers.remove(index);
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
      {disabled && !headers.length ? null : <AdditionalHeaderInputHeading />}
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
                  onDeleteClick={handleDeleteClick(arrayHelpers, index)}
                />
              ))
            )}
            {!disabled ? (
              <AdditionalHeaderInput
                showAddBtn
                value={newHeader}
                onChange={handleNewParamChange}
                onAddClick={handleAddNewHeader(arrayHelpers)}
                headerError={headerErrorMsg}
              />
            ) : null}
          </>
        )}
      </FieldArray>
    </div>
  );
}

export { TabContentAdditionalHeaders };
