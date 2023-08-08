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
  style?: React.CSSProperties;
  size?: number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

function CheckBox(props: CheckBoxProps) {
  const {
    name,
    label,
    error,
    value,
    checked = false,
    disabled = false,
    size = 20,
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
      <label
        className={styles.control}
        style={{ height: size, fontSize: size }}>
        <input
          className={styles.input}
          type="checkbox"
          name={name}
          checked={checked}
          value={value}
          disabled={disabled}
          onChange={onChange}
        />
      </label>
      <div className={styles.labelText}>
        <div>{label}</div>
      </div>
    </div>
  );
}

export { CheckBox };
