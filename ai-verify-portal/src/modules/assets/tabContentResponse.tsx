import { useFormikContext } from 'formik';
import { ModelAPIFormModel, Response } from './types';
import {
  ResponseInputHeading,
  ResponsePropertyInput,
} from './responseParamInput';

function TabContentResponse() {
  const { values, setFieldValue } = useFormikContext<ModelAPIFormModel>();

  const value: Response = {
    statusCode: values.response.statusCode,
    mediaType: values.response.mediaType,
    type: values.response.type,
  };

  function handleChange(value: Response) {
    setFieldValue('response.statusCode', value.statusCode);
    setFieldValue('response.mediaType', value.mediaType);
    setFieldValue('response.type', value.type);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ResponseInputHeading />
      <ResponsePropertyInput value={value} onChange={handleChange} />
    </div>
  );
}

export { TabContentResponse };
