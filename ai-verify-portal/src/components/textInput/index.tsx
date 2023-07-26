import React, { ChangeEventHandler } from 'react';
import styles from './styles/textInput.module.css';

type TextInputProps = {
  name: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  value?: string;
  maxLength?: number;
  labelSibling?: React.ReactElement;
  style?: React.CSSProperties;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

function TextInput(props: TextInputProps) {
  const {
    name,
    label,
    placeholder,
    disabled,
    error,
    maxLength,
    value,
    labelSibling,
    style,
    onChange,
  } = props;

  return (
    <div className={styles.textInput} style={style}>
      <label>
        {label !== '' && label !== undefined ? (
          <div className={styles.label}>
            <div>{label}</div>
            {labelSibling}
          </div>
        ) : null}
        <input
          disabled={disabled}
          type="text"
          name={name}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onChange={onChange}
        />
        {Boolean(error) ? (
          <div className={styles.inputError}>{error}</div>
        ) : null}
      </label>
    </div>
  );
}

export { TextInput };
