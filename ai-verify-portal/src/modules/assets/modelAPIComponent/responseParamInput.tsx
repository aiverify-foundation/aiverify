import { TextInput } from 'src/components/textInput';
import styles from './styles/newModelApiConfig.module.css';
import { MediaType, ModelAPIFormModel, OpenApiDataTypes } from './types';
import { SelectInput } from 'src/components/selectInput';
import { optionsMediaTypes, optionsOpenApiDataTypes } from './selectOptions';
import { useFormikContext } from 'formik';

const responseFieldName = 'modelAPI.response';

function ResponseInputHeading() {
  return (
    <div style={{ display: 'flex', marginBottom: 4 }}>
      <div className={styles.headingName} style={{ width: 90 }}>
        Status Code
      </div>
      <div className={styles.headingVal}>Media Type</div>
      <div className={styles.headingVal}>Data Type</div>
      <div className={styles.headingVal}>Field Name</div>
      <div></div>
    </div>
  );
}

function ResponsePropertyInput({ disabled = false }: { disabled?: boolean }) {
  const { values, errors, touched, handleChange } =
    useFormikContext<ModelAPIFormModel>();
  const fieldErrors = errors.modelAPI?.response;
  const touchedFields = touched.modelAPI?.response;

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
          options={optionsMediaTypes}
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
      <div className={styles.keyValCol}>
        <TextInput
          disabled={disabled}
          name={`${responseFieldName}.field`}
          onChange={handleChange}
          value={values.modelAPI.response.field}
          maxLength={128}
          style={{ marginBottom: 0 }}
        />
      </div>
    </div>
  );
}

export { ResponseInputHeading, ResponsePropertyInput };
