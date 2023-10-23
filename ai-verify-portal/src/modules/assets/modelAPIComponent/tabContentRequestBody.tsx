import { SelectInput } from 'src/components/selectInput';
import {
  BatchStrategy,
  BodyParam,
  MediaType,
  ModelApiFormModel,
  OpenApiDataTypes,
  RequestBody,
} from './types';
import {
  FieldArray,
  FieldArrayRenderProps,
  useFormikContext,
  FormikErrors,
  FormikTouched,
} from 'formik';
import { optionsBatchStrategies, optionsMediaTypes } from './selectOptions';
import { ChangeEvent, useEffect, useState } from 'react';
import { getInputReactKeyId } from '.';
import {
  RequestBodyParameterInput,
  RequestBodyParamsHeading,
} from './requestBodyParamInput';
import { ColorPalette } from 'src/components/colorPalette';
import InfoIcon from '@mui/icons-material/Info';
import { Tooltip, TooltipPosition } from 'src/components/tooltip';
import { TextInput } from 'src/components/textInput';

const defaultBodyParameter: BodyParam = {
  reactPropId: '',
  field: '',
  type: OpenApiDataTypes.INTEGER,
};

const requestBodyFieldName = 'modelAPI.requestBody';
const otherReqConfigFieldName = 'modelAPI.requestConfig';

const PropExistsMsg = 'Property exists';
const RequiredMsg = 'Required';

function TabContentRequestBody({ disabled = false }: { disabled: boolean }) {
  const [newParam, setNewParam] = useState<BodyParam>(defaultBodyParameter);
  const [errorMsg, setErrorMsg] = useState<string>();
  const { values, errors, touched, handleChange, setFieldValue } =
    useFormikContext<ModelApiFormModel>();
  const requestBody = values.modelAPI.requestBody;
  const properties = requestBody?.properties || [];
  const requestConfig = values.modelAPI.requestConfig;
  const reqConfFieldErrors = errors.modelAPI?.requestConfig;
  const reqConfTouchedFields = touched.modelAPI?.requestConfig;
  const requestBodyErrors = errors.modelAPI?.requestBody as
    | FormikErrors<RequestBody>
    | undefined;
  const fieldErrors = requestBodyErrors?.properties as
    | FormikErrors<BodyParam>[]
    | string
    | undefined;
  const touchedRequestBody = touched.modelAPI?.requestBody as
    | FormikTouched<RequestBody>
    | undefined;
  const touchedFields = touchedRequestBody?.properties as
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

  useEffect(() => {
    if (requestConfig.batchStrategy === BatchStrategy.multipart) {
      setFieldValue(`${requestBodyFieldName}.mediaType`, MediaType.APP_JSON);
    }
  }, [requestConfig.batchStrategy]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        marginBottom: 15,
      }}>
      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'space-between',
          marginBottom: 15,
          width: 825,
        }}>
        <SelectInput<MediaType>
          disabled={
            disabled || requestConfig.batchStrategy === BatchStrategy.multipart
          }
          width={240}
          label="Media Type"
          name={`${requestBodyFieldName}.mediaType`}
          options={mediaTypeOptions}
          value={requestBody?.mediaType}
          onSyntheticChange={handleChange}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <SelectInput<BatchStrategy>
            disabled={disabled}
            label="Batch Requests"
            name={`${otherReqConfigFieldName}.batchStrategy`}
            options={optionsBatchStrategies}
            onSyntheticChange={handleChange}
            value={requestConfig.batchStrategy}
            style={{ marginBottom: 0, width: '100%' }}
            labelSibling={
              <Tooltip
                backgroundColor={ColorPalette.gray}
                fontColor={ColorPalette.white}
                content={
                  <div style={{ marginBottom: 5 }}>
                    Request batching might improve the time for the test to run.
                    Batching can only be done with application/json media type.
                    Enabling this config will change the media/type to
                    application/json
                  </div>
                }
                position={TooltipPosition.right}
                offsetLeft={8}>
                <InfoIcon style={{ fontSize: 18, color: ColorPalette.gray2 }} />
              </Tooltip>
            }
          />
          <TextInput
            disabled={
              disabled || requestConfig.batchStrategy === BatchStrategy.none
            }
            label="Batch Limit"
            name={`${otherReqConfigFieldName}.batchLimit`}
            onChange={handleChange}
            value={requestConfig.batchLimit}
            maxLength={128}
            style={{ marginBottom: 0, width: '100%' }}
            error={
              Boolean(
                reqConfFieldErrors?.batchLimit &&
                  reqConfTouchedFields?.batchLimit
              )
                ? reqConfFieldErrors?.batchLimit
                : undefined
            }
            labelSibling={
              <Tooltip
                backgroundColor={ColorPalette.gray}
                fontColor={ColorPalette.white}
                content={
                  <div style={{ marginBottom: 5 }}>
                    Defaults to -1, which means there is no limit.
                  </div>
                }
                position={TooltipPosition.right}
                offsetLeft={8}>
                <InfoIcon style={{ fontSize: 18, color: ColorPalette.gray2 }} />
              </Tooltip>
            }
          />
        </div>
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
                          ? fieldErrors &&
                            (fieldErrors[index] as FormikErrors<BodyParam>)
                              ?.field
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
