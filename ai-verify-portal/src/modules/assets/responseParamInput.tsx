import { TextInput } from 'src/components/textInput';
import styles from './styles/newModelApiConfig.module.css';
import {
  MediaType,
  ModelAPIFormModel,
  OpenApiDataTypes,
  Response,
} from './types';
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

function ResponsePropertyInput() {
  const { values, setFieldValue, handleChange } =
    useFormikContext<ModelAPIFormModel>();

  function handleMediaChange(val: MediaType) {
    setFieldValue(`${responseFieldName}.mediaType`, val);
  }

  function handleTypeChange(val: OpenApiDataTypes) {
    setFieldValue(`${responseFieldName}.type`, val);
  }

  return (
    <div className={styles.keyValRow}>
      <div className={styles.keyValCol} style={{ width: 90 }}>
        <TextInput
          name={`${responseFieldName}.statusCode`}
          onChange={handleChange}
          value={values.modelAPI.response.statusCode.toString()}
          maxLength={128}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.keyValCol}>
        <SelectInput<MediaType>
          name={`${responseFieldName}.mediaType`}
          options={optionsMediaTypes}
          onChange={handleMediaChange}
          value={values.modelAPI.response.mediaType}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.keyValCol}>
        <SelectInput<OpenApiDataTypes>
          name={`${responseFieldName}.type`}
          options={optionsOpenApiDataTypes}
          onChange={handleTypeChange}
          value={values.modelAPI.response.type}
          style={{ marginBottom: 0 }}
        />
      </div>
      <div className={styles.keyValCol}>
        <TextInput
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
