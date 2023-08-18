import { useFormikContext } from 'formik';
import { TextArea } from 'src/components/textArea';
import { TextInput } from 'src/components/textInput';
import { ModelApiFormModel } from './types';

type ApiConfigNameDescFormProps = {
  onOKClick: () => void;
  disabledOkBtn?: boolean;
};

function ApiConfigNameDescForm(props: ApiConfigNameDescFormProps) {
  const { onOKClick, disabledOkBtn = false } = props;

  const { values, errors, touched, handleChange } =
    useFormikContext<ModelApiFormModel>();
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
        error={Boolean(errors.name && touched.name) ? errors.name : undefined}
      />
      <TextArea
        label="Description"
        name="description"
        value={values.description}
        onChange={handleChange}
        error={
          Boolean(errors.description && touched.description)
            ? errors.description
            : undefined
        }
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          disabled={disabledOkBtn}
          style={{ width: '49%', marginRight: 0 }}
          className="aivBase-button aivBase-button--outlined aivBase-button--small"
          onClick={onOKClick}>
          OK
        </button>
      </div>
    </div>
  );
}

export { ApiConfigNameDescForm };
