import { useFormikContext } from 'formik';
import {
  ResponseInputHeading,
  ResponsePropertyInput,
} from './responseParamInput';
import { ModelApiFormModel } from './types';

/* Input fields are separated into another component, in case fieldarray of response has to be implemented */
function TabContentResponse({
  disabled = false,
  id,
}: {
  disabled?: boolean;
  id?: string;
}) {
  const formikContext = useFormikContext<ModelApiFormModel>();
  const isNewModel = id === undefined;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ResponseInputHeading formikContext={formikContext} />
      <ResponsePropertyInput
        isNewModel={isNewModel}
        disabled={disabled}
        formikContext={formikContext}
      />
    </div>
  );
}

export { TabContentResponse };
