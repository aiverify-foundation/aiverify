import { ChangeEvent } from 'react';
import { TextArea } from 'src/components/textArea';
import { TextInput } from 'src/components/textInput';

type ApiConfigNameDescFormProps = {
  name: string;
  desc: string;
  onNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDescChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onOKClick: () => void;
  onCancelClick: () => void;
};

function ApiConfigNameDescForm(props: ApiConfigNameDescFormProps) {
  const { name, desc, onDescChange, onNameChange, onOKClick, onCancelClick } =
    props;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}>
      <TextInput
        label="Config Name"
        name="configName"
        value={name}
        maxLength={255}
        style={{ marginBottom: 10 }}
        onChange={onNameChange}
      />
      <TextArea
        label="Description"
        name="configDesc"
        value={desc}
        onChange={onDescChange}
      />
      <div style={{ textAlign: 'right' }}>
        <button
          style={{ width: 100 }}
          className="aivBase-button aivBase-button--outlined aivBase-button--small"
          onClick={onOKClick}>
          Cancel
        </button>
        <button
          style={{ width: 100, marginRight: 0 }}
          className="aivBase-button aivBase-button--outlined aivBase-button--small"
          onClick={onCancelClick}>
          OK
        </button>
      </div>
    </div>
  );
}

export { ApiConfigNameDescForm };
