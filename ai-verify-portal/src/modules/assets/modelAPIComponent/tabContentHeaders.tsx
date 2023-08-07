import { AdditionalHeader, ModelApiFormModel, OpenApiDataTypes } from './types';
import {
  FieldArray,
  FieldArrayRenderProps,
  FormikErrors,
  FormikTouched,
  useFormikContext,
} from 'formik';
import { ChangeEvent, useEffect, useState } from 'react';
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
  const { values, errors, touched, handleChange, setFieldValue } =
    useFormikContext<ModelApiFormModel>();
  const headers = values.modelAPI.additionalHeaders || [];
  const fieldErrors = errors.modelAPI?.additionalHeaders as
    | FormikErrors<AdditionalHeader>[]
    | undefined;
  const touchedFields = touched.modelAPI?.additionalHeaders as
    | FormikTouched<AdditionalHeader>[]
    | undefined;

  // overloading just to make the type compatible with formik's `handleChange` signature
  function handleNewParamChange(e: ChangeEvent<HTMLInputElement>): void;
  function handleNewParamChange(arg: AdditionalHeader): void;
  function handleNewParamChange(
    arg: AdditionalHeader | ChangeEvent<HTMLInputElement>
  ) {
    if (headerErrorMsg !== undefined) setHeaderErrorMsg(undefined);
    if (valueErrorMsg !== undefined) setValueErrorMsg(undefined);
    if ('name' in arg) {
      setNewHeader((prev) => ({
        ...arg,
        reactPropId:
          prev.reactPropId === '' ? getInputReactKeyId() : prev.reactPropId,
      }));
    }
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
                  isFormikBinded
                  headerInputName={`modelAPI.additionalHeaders.${index}.name`}
                  headerTypeName={`modelAPI.additionalHeaders.${index}.type`}
                  headerValueName={`modelAPI.additionalHeaders.${index}.value`}
                  disabled={disabled}
                  key={header.reactPropId}
                  value={header}
                  onChange={handleChange}
                  onDeleteClick={handleDeleteClick(arrayHelpers, index)}
                  headerError={
                    Boolean(
                      fieldErrors &&
                        fieldErrors[index]?.name &&
                        touchedFields &&
                        touchedFields[index]?.name
                    )
                      ? fieldErrors && fieldErrors[index]?.name
                      : undefined
                  }
                  valueError={
                    Boolean(
                      fieldErrors &&
                        fieldErrors[index]?.value &&
                        touchedFields &&
                        touchedFields[index]?.value
                    )
                      ? fieldErrors && fieldErrors[index]?.value
                      : undefined
                  }
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
