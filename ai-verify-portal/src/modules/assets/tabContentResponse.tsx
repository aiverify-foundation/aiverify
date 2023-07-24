import { useFormikContext } from 'formik';
import { ModelAPIFormModel, Response } from './types';
import {
  ResponseInputHeading,
  ResponsePropertyInput,
} from './responseParamInput';

const responseFieldName = 'modelAPI.response';

function TabContentResponse() {
  const { values, setFieldValue } = useFormikContext<ModelAPIFormModel>();

  const value: Response = {
    statusCode: values.modelAPI.response.statusCode,
    mediaType: values.modelAPI.response.mediaType,
    type: values.modelAPI.response.type,
    field: values.modelAPI.response.field,
  };

  function handleChange(value: Response) {
    setFieldValue(`${responseFieldName}.statusCode`, value.statusCode);
    setFieldValue(`${responseFieldName}.mediaType`, value.mediaType);
    setFieldValue(`${responseFieldName}.type`, value.type);
    setFieldValue(`${responseFieldName}.field`, value.field);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ResponseInputHeading />
      <ResponsePropertyInput value={value} onChange={handleChange} />
    </div>
  );
}

export { TabContentResponse };
