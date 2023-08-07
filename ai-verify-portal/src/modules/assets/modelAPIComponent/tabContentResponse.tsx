import { useFormikContext } from 'formik';
import {
  ResponseInputHeading,
  ResponsePropertyInput,
} from './responseParamInput';
import { ModelApiFormModel } from './types';

/* Input fields are separated into another component, in case fieldarray of response has to be implemented */
function TabContentResponse({ disabled = false }: { disabled?: boolean }) {
  const formikContext = useFormikContext<ModelApiFormModel>();
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ResponseInputHeading formikContext={formikContext} />
      <ResponsePropertyInput
        disabled={disabled}
        formikContext={formikContext}
      />
    </div>
  );
}

export { TabContentResponse };
