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
  const properties = values.modelAPI.requestBody?.properties || [];
  const fieldErrors = errors.modelAPI?.requestBody?.properties as
    | FormikErrors<BodyParam>[]
    | undefined;
  const touchedFields = touched.modelAPI?.requestBody?.properties as
    | FormikTouched<BodyParam>[]
    | undefined;
  const mediaTypeOptions = [optionsMediaTypes[1], optionsMediaTypes[2]];

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
      if (!values.modelAPI.requestBody) return;
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
        values.modelAPI.requestBody?.properties[index].field === newParam.field
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
        options={mediaTypeOptions}
        value={values.modelAPI.requestBody?.mediaType}
        onSyntheticChange={handleChange}
      />
      <div style={{ position: 'relative', width: 500, marginBottom: 15 }}>
        <TextInput
          label="."
          disabled={disabled || !values.modelAPI.requestBody?.isArray}
          name={`${requestBodyFieldName}.name`}
          onChange={handleChange}
          value={values.modelAPI.requestBody?.name}
          maxLength={128}
          style={{ marginBottom: 0, width: 240 }}
        />
        <CheckBox
          label="Format as array (Provide array variable name below)"
          disabled={disabled}
          checked={values.modelAPI.requestBody?.isArray}
          name={`${requestBodyFieldName}.isArray`}
          value={values.modelAPI.requestBody?.isArray}
          onChange={handleChange}
          style={{ position: 'absolute', top: 0 }}
        />
      </div>
      {values.modelAPI.requestBody?.mediaType !== MediaType.NONE ? (
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
