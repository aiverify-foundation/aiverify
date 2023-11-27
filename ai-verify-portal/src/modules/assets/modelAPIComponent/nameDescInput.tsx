import { useFormikContext } from 'formik';
import { TextArea } from 'src/components/textArea';
import { TextInput } from 'src/components/textInput';
import { ModelApiFormModel } from './types';

type ApiConfigNameDescFormProps = {
  onOKClick: () => void;
  disabledOkBtn?: boolean;
  hasDuplicateNameError: boolean;
};

function ApiConfigNameDescForm(props: ApiConfigNameDescFormProps) {
  const {
    onOKClick,
    disabledOkBtn = false,
    hasDuplicateNameError = false,
  } = props;

  const { values, errors, touched, handleChange } =
    useFormikContext<ModelApiFormModel>();

  let nameError;
  if (Boolean(errors.name && touched.name)) {
    nameError = errors.name;
  } else if (hasDuplicateNameError) {
    nameError = 'Name already exists';
  }

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
        error={nameError}
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
