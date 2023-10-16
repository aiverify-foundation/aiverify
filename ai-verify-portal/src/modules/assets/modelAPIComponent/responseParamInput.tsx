import { TextInput } from 'src/components/textInput';
import styles from './styles/newModelApiConfig.module.css';
import {
  BatchStrategy,
  MediaType,
  ModelApiFormModel,
  OpenApiDataTypes,
  RequestMethod,
} from './types';
import { SelectInput } from 'src/components/selectInput';
import { optionsMediaTypes, optionsOpenApiDataTypes } from './selectOptions';
import { FormikContextType } from 'formik';
import { ColorPalette } from 'src/components/colorPalette';
import { useEffect } from 'react';
import { ResponsePreview } from './responsePreview';

const responseFieldName = 'modelAPI.response';

type ResponseInputHeadingProps = {
  formikContext: FormikContextType<ModelApiFormModel>;
};

const arrayItemsDataOptions = optionsOpenApiDataTypes.filter(
  (item) => item.value !== OpenApiDataTypes.ARRAY
);

const arrItemObjDataTypeOptions = [
  optionsOpenApiDataTypes[0],
  optionsOpenApiDataTypes[1],
  optionsOpenApiDataTypes[2],
];

function ResponseInputHeading(props: ResponseInputHeadingProps) {
  const { formikContext } = props;
  const { values } = formikContext;

  return (
    <div style={{ display: 'flex', marginBottom: 4 }}>
      <div className={styles.headingName} style={{ width: 90 }}>
        Success Status Code
      </div>
      <div className={styles.headingVal}>Media Type</div>
      <div className={styles.headingVal}>Data Type</div>
      {values.modelAPI.response.mediaType === MediaType.APP_JSON &&
      values.modelAPI.response.schema.type === OpenApiDataTypes.OBJECT ? (
        <>
          <div className={styles.headingVal}>Field Name</div>
          <div className={styles.headingVal}>Field Data Type</div>
        </>
      ) : null}
      {values.modelAPI.response.mediaType === MediaType.APP_JSON &&
      values.modelAPI.response.schema.type === OpenApiDataTypes.ARRAY ? (
        <div className={styles.headingVal}>Array Items Data Type</div>
      ) : null}
      <div></div>
    </div>
  );
}

type ResponsePropertyInputProps = {
  disabled: boolean;
  formikContext: FormikContextType<ModelApiFormModel>;
};

function ResponsePropertyInput(props: ResponsePropertyInputProps) {
  const { disabled, formikContext } = props;
  const { values, errors, touched, handleChange, setFieldValue } =
    formikContext;
  const fieldErrors = errors.modelAPI?.response;
  const touchedFields = touched.modelAPI?.response;
  const mediaTypeOptions = [optionsMediaTypes[3], optionsMediaTypes[4]];
  const requestConfigBatchStrat = values.modelAPI.requestConfig.batchStrategy;
  const requestMethod = values.modelAPI.method;

  let dataTypeOptions: {
    value: OpenApiDataTypes;
    label: OpenApiDataTypes;
  }[] = optionsOpenApiDataTypes;
  if (values.modelAPI.response.mediaType === MediaType.TEXT_PLAIN) {
    dataTypeOptions = [
      optionsOpenApiDataTypes[0],
      optionsOpenApiDataTypes[1],
      optionsOpenApiDataTypes[2],
    ];
  } else if (values.modelAPI.response.mediaType === MediaType.APP_JSON) {
    dataTypeOptions = [optionsOpenApiDataTypes[3], optionsOpenApiDataTypes[4]];
  }

  const fieldDataTypeOptions = [
    optionsOpenApiDataTypes[0],
    optionsOpenApiDataTypes[1],
    optionsOpenApiDataTypes[2],
    optionsOpenApiDataTypes[3],
  ];

  useEffect(() => {
    if (
      requestConfigBatchStrat === BatchStrategy.multipart &&
      requestMethod === RequestMethod.POST
    ) {
      setFieldValue(`${responseFieldName}.mediaType`, MediaType.APP_JSON);
    }
  }, []);

  useEffect(() => {
    if (
      requestConfigBatchStrat === BatchStrategy.multipart &&
      requestMethod === RequestMethod.POST
    ) {
      setFieldValue(`${responseFieldName}.mediaType`, MediaType.APP_JSON);
    }
  }, [requestConfigBatchStrat, requestMethod]);

  useEffect(() => {
    const mediaType = values.modelAPI.response.mediaType;
    if (mediaType === MediaType.TEXT_PLAIN) {
      setFieldValue(
        `${responseFieldName}.schema.type`,
        OpenApiDataTypes.INTEGER
      );
    } else if (mediaType === MediaType.APP_JSON) {
      setFieldValue(`${responseFieldName}.schema.type`, OpenApiDataTypes.ARRAY);
    }
  }, [values.modelAPI.response.mediaType]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className={styles.keyValRow}>
        <div className={styles.keyValCol} style={{ width: 90 }}>
          <TextInput
            disabled={disabled}
            name={`${responseFieldName}.statusCode`}
            onChange={handleChange}
            value={values.modelAPI.response.statusCode.toString()}
            maxLength={128}
            style={{ marginBottom: 0 }}
            error={
              Boolean(fieldErrors?.statusCode && touchedFields?.statusCode)
                ? fieldErrors?.statusCode
                : undefined
            }
          />
        </div>
        <div className={styles.keyValCol}>
          <SelectInput<MediaType>
            disabled={
              disabled ||
              (requestConfigBatchStrat === BatchStrategy.multipart &&
                requestMethod === RequestMethod.POST)
            }
            name={`${responseFieldName}.mediaType`}
            options={mediaTypeOptions}
            value={values.modelAPI.response.mediaType}
            onSyntheticChange={handleChange}
            style={{ marginBottom: 0 }}
          />
        </div>
        <div className={styles.keyValCol}>
          <SelectInput<OpenApiDataTypes>
            disabled={disabled}
            name={`${responseFieldName}.schema.type`}
            options={dataTypeOptions}
            value={values.modelAPI.response.schema.type}
            onSyntheticChange={handleChange}
            style={{ marginBottom: 0 }}
          />
        </div>
        {values.modelAPI.response.mediaType === MediaType.APP_JSON &&
        values.modelAPI.response.schema.type === OpenApiDataTypes.ARRAY ? (
          <div className={styles.keyValCol}>
            <SelectInput<OpenApiDataTypes>
              disabled={disabled}
              name={`${responseFieldName}.schema.items.type`}
              options={arrayItemsDataOptions}
              value={values.modelAPI.response.schema.items?.type}
              onSyntheticChange={handleChange}
              style={{ marginBottom: 0 }}
            />
          </div>
        ) : null}
        {values.modelAPI.response.mediaType === MediaType.APP_JSON &&
        values.modelAPI.response.schema.type === OpenApiDataTypes.OBJECT ? (
          <>
            <div className={styles.keyValCol}>
              <TextInput
                disabled={disabled}
                name={`${responseFieldName}.field`}
                onChange={handleChange}
                value={values.modelAPI.response.field}
                maxLength={128}
                style={{ marginBottom: 0 }}
                error={
                  Boolean(fieldErrors?.field && touchedFields?.field)
                    ? fieldErrors?.field
                    : undefined
                }
              />
            </div>
            <div className={styles.keyValCol}>
              <SelectInput<OpenApiDataTypes>
                disabled={disabled}
                name={`${responseFieldName}.fieldValueType`}
                options={fieldDataTypeOptions}
                value={values.modelAPI.response.fieldValueType}
                onSyntheticChange={handleChange}
                style={{ marginBottom: 0 }}
              />
            </div>
          </>
        ) : null}
      </div>

      {values.modelAPI.response.mediaType === MediaType.APP_JSON &&
      values.modelAPI.response.schema.type === OpenApiDataTypes.ARRAY &&
      values.modelAPI.response.schema.items?.type ===
        OpenApiDataTypes.OBJECT ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              color: ColorPalette.gray,
              fontWeight: 600,
              marginBottom: 10,
              marginTop: 35,
              fontSize: 14,
            }}>
            Describe the Array Item Object
          </div>
          <div style={{ display: 'flex', marginBottom: 4 }}>
            <div className={styles.headingName} style={{ width: 90 }}>
              Field Name
            </div>
            <div className={styles.headingVal}>Data Type</div>
          </div>
          <div className={styles.keyValRow}>
            <div className={styles.keyValCol}>
              <TextInput
                disabled={disabled}
                name={`${responseFieldName}.field`}
                onChange={handleChange}
                value={values.modelAPI.response.field}
                maxLength={128}
                style={{ marginBottom: 0 }}
                error={
                  Boolean(fieldErrors?.field && touchedFields?.field)
                    ? fieldErrors?.field
                    : undefined
                }
              />
            </div>
            <div className={styles.keyValCol}>
              <SelectInput<OpenApiDataTypes>
                disabled={disabled}
                name={`${responseFieldName}.schema.items.properties._AIVDATA_.type`}
                options={arrItemObjDataTypeOptions}
                value={
                  values.modelAPI.response.schema.items?.properties?._AIVDATA_
                    .type
                }
                onSyntheticChange={handleChange}
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {values.modelAPI.response.mediaType === MediaType.APP_JSON &&
      values.modelAPI.response.schema.type === OpenApiDataTypes.OBJECT &&
      values.modelAPI.response.fieldValueType === OpenApiDataTypes.ARRAY ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              color: ColorPalette.gray,
              fontWeight: 600,
              marginBottom: 10,
              marginTop: 35,
              fontSize: 14,
            }}>
            Describe the Field Array Item
          </div>
          <div style={{ display: 'flex', marginBottom: 4 }}>
            <div className={styles.headingName} style={{ width: 90 }}>
              Data Type
            </div>
          </div>
          <div className={styles.keyValRow}>
            <div className={styles.keyValCol}>
              <SelectInput<OpenApiDataTypes>
                disabled={disabled}
                name={`${responseFieldName}.schema.properties._AIVDATA_.items.type`}
                options={arrItemObjDataTypeOptions}
                value={
                  values.modelAPI.response.schema.properties?._AIVDATA_.items
                    ?.type
                }
                onSyntheticChange={handleChange}
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>
        </div>
      ) : null}
      <ResponsePreview responseType={values.modelAPI.response} />
    </div>
  );
}

export { ResponseInputHeading, ResponsePropertyInput };
