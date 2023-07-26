import {
  ResponseInputHeading,
  ResponsePropertyInput,
} from './responseParamInput';

/* Input fields are separated into another component, in case fieldarray of response has to be implemented */
function TabContentResponse({ disabled = false }: { disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ResponseInputHeading />
      <ResponsePropertyInput disabled={disabled} />
    </div>
  );
}

export { TabContentResponse };
