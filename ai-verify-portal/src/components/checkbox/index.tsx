import React, { ChangeEventHandler, useState } from 'react';
import styles from './styles/checkbox.module.css';
import clsx from 'clsx';

type CheckBoxProps = {
  name: string;
  label?: string;
  error?: string;
  checked?: boolean;
  value?: boolean;
  disabled?: boolean;
  labelSibling?: React.ReactElement;
  style?: React.CSSProperties;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

function CheckBox(props: CheckBoxProps) {
  const {
    name,
    label,
    error,
    value,
    checked = false,
    labelSibling,
    disabled = false,
    style,
    onChange,
  } = props;

  return (
    <div
      className={clsx(
        styles.checkbox,
        error !== undefined ? styles.inputError : null
      )}
      style={style}>
      <label>
        <div className={styles.label}>
          <div>{label}</div>
          {labelSibling}
        </div>
        <input
          type="checkbox"
          name={name}
          checked={checked}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
        {Boolean(error) ? (
          <div className={styles.errorText}>{error}</div>
        ) : null}
      </label>
    </div>
  );
}

export { CheckBox };
