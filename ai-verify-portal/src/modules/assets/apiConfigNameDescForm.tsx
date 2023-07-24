import { useFormikContext } from 'formik';
import { TextArea } from 'src/components/textArea';
import { TextInput } from 'src/components/textInput';
import { ModelAPIFormModel } from './types';

type ApiConfigNameDescFormProps = {
  onOKClick: () => void;
  onCancelClick: () => void;
};

function ApiConfigNameDescForm(props: ApiConfigNameDescFormProps) {
  const { onOKClick, onCancelClick } = props;

  const { values, handleChange } = useFormikContext<ModelAPIFormModel>();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}>
      <TextInput
        label="Config Name"
        name="name"
        value={values.name}
        maxLength={255}
        style={{ marginBottom: 10 }}
        onChange={handleChange}
      />
      <TextArea
        label="Description"
        name="description"
        value={values.description}
        onChange={handleChange}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          style={{ width: '49%', marginRight: 0 }}
          className="aivBase-button aivBase-button--outlined aivBase-button--small"
          onClick={onOKClick}>
          Cancel
        </button>
        <button
          style={{ width: '49%', marginRight: 0 }}
          className="aivBase-button aivBase-button--outlined aivBase-button--small"
          onClick={onCancelClick}>
          OK
        </button>
      </div>
    </div>
  );
}

export { ApiConfigNameDescForm };
