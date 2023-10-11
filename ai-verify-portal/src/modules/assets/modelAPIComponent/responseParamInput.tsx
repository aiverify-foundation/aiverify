import { TextInput } from 'src/components/textInput';
import styles from './styles/newModelApiConfig.module.css';
import { MediaType, ModelApiFormModel, OpenApiDataTypes } from './types';
import { SelectInput } from 'src/components/selectInput';
import { optionsMediaTypes, optionsOpenApiDataTypes } from './selectOptions';
import { FormikContextType } from 'formik';
import { ColorPalette } from 'src/components/colorPalette';

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
        Status Code
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
  const { values, errors, touched, handleChange } = formikContext;
  const fieldErrors = errors.modelAPI?.response;
  const touchedFields = touched.modelAPI?.response;
  const mediaTypeOptions = [optionsMediaTypes[3], optionsMediaTypes[4]];

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
  }

  console.log(values.modelAPI);

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
            disabled={disabled}
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
                options={arrayItemsDataOptions}
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
              marginTop: 15,
              fontSize: 14,
            }}>
            Describe the Array Item Object
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
                name={`${responseFieldName}.schema.items.properties.data.type`}
                options={arrItemObjDataTypeOptions}
                value={
                  values.modelAPI.response.schema.items?.properties?.data.type
                }
                onSyntheticChange={handleChange}
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { ResponseInputHeading, ResponsePropertyInput };
