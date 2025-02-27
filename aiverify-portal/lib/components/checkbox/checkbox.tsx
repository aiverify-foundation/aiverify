'use client';

import clsx from 'clsx';
import { ComponentProps } from 'react';
import styles from './styles/checkbox.module.css';

export type CheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'size'> & {
  label: string;
  size?: 's' | 'l';
  labelClassName?: string;
  error?: string;
};

function Checkbox(props: CheckboxProps) {
  const {
    id,
    name,
    label,
    size = 's',
    labelClassName,
    value,
    defaultValue,
    checked,
    defaultChecked,
    disabled = false,
    error,
    onChange,
    onClick,
  } = props;
  return (
    <div
      className={clsx(
        styles.wrapper,
        error !== undefined ? styles.inputError : null
      )}>
      <label
        htmlFor={id}
        className={clsx(
          styles[`label-${size}`],
          'text-black dark:text-white',
          labelClassName
        )}>
        <input
          id={id}
          name={name}
          aria-label={label}
          type="checkbox"
          className={clsx(
            styles.checkbox,
            `border-primary-900 bg-primary-300 dark:border-primary-200 dark:bg-primary-400`,
            error && styles.inputError
          )}
          checked={checked}
          defaultChecked={defaultChecked}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={onChange}
          onClick={onClick}
        />
        {label}
      </label>
      {error && <div className={styles.errorText}>{error}</div>}
    </div>
  );
}

export { Checkbox };
