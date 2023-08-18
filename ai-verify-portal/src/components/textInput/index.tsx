import React, { ChangeEventHandler } from 'react';
import styles from './styles/textInput.module.css';
import clsx from 'clsx';

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
  inputStyle?: React.CSSProperties;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onBlur?: ChangeEventHandler<HTMLInputElement>;
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
    inputStyle,
    onChange,
    onBlur,
  } = props;

  return (
    <div
      className={clsx(
        styles.textInput,
        error !== undefined ? styles.inputError : null
      )}
      style={style}>
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
          onBlur={onBlur}
          style={inputStyle}
        />
        {Boolean(error) ? (
          <div className={styles.errorText}>{error}</div>
        ) : null}
      </label>
    </div>
  );
}

export { TextInput };
