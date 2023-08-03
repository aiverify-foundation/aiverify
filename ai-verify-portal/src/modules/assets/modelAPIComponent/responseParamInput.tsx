import { TextInput } from 'src/components/textInput';
import styles from './styles/newModelApiConfig.module.css';
import { MediaType, ModelAPIFormModel, OpenApiDataTypes } from './types';
import { SelectInput } from 'src/components/selectInput';
import { optionsMediaTypes, optionsOpenApiDataTypes } from './selectOptions';
import { FormikContextType } from 'formik';

const responseFieldName = 'modelAPI.response';

type ResponseInputHeadingProps = {
  formikContext: FormikContextType<ModelAPIFormModel>;
};

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
      {values.modelAPI.response.mediaType === MediaType.APP_JSON ? (
        <div className={styles.headingVal}>Field Name</div>
      ) : null}
      <div></div>
    </div>
  );
}

type ResponsePropertyInputProps = {
  disabled: boolean;
  formikContext: FormikContextType<ModelAPIFormModel>;
};

function ResponsePropertyInput(props: ResponsePropertyInputProps) {
  const { disabled, formikContext } = props;
  const { values, errors, touched, handleChange } = formikContext;
  const fieldErrors = errors.modelAPI?.response;
  const touchedFields = touched.modelAPI?.response;
  const mediaTypeOptions = [optionsMediaTypes[3], optionsMediaTypes[4]];

  return (
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
          name={`${responseFieldName}.type`}
          options={optionsOpenApiDataTypes}
          value={values.modelAPI.response.type}
          onSyntheticChange={handleChange}
          style={{ marginBottom: 0 }}
        />
      </div>
      {values.modelAPI.response.mediaType === MediaType.APP_JSON ? (
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
      ) : null}
    </div>
  );
}

export { ResponseInputHeading, ResponsePropertyInput };
