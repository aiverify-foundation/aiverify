import {
  ResponseInputHeading,
  ResponsePropertyInput,
} from './responseParamInput';

/* Input fields are separated into another component, in case fieldarray of response has to be implemented */
function TabContentResponse() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ResponseInputHeading />
      <ResponsePropertyInput />
    </div>
  );
}

export { TabContentResponse };
