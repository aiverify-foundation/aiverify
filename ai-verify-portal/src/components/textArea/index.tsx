import React, { ChangeEventHandler } from 'react';
import styles from './styles/textArea.module.css';
import clsx from 'clsx';

type TextInputProps = {
  name: string;
  label?: string;
  placeholder?: string;
  error?: string;
  value?: string;
  maxLength?: number;
  labelSibling?: React.ReactElement;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
};

function TextArea(props: TextInputProps) {
  const {
    name,
    label,
    placeholder,
    error,
    maxLength,
    value,
    labelSibling,
    onChange,
  } = props;

  return (
    <div
      className={clsx(
        styles.textInput,
        error !== undefined ? styles.inputError : null
      )}>
      <label>
        <div className={styles.label}>
          <div>{label}</div>
          {labelSibling}
        </div>
        <textarea
          name={name}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onChange={onChange}
        />
        {Boolean(error) ? (
          <div className={styles.errorText}>{error}</div>
        ) : null}
      </label>
    </div>
  );
}

export { TextArea };
