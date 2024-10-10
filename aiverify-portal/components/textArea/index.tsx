import clsx from 'clsx';
import React, { ComponentProps, ChangeEvent, KeyboardEventHandler, useEffect, useRef } from 'react';
import styles from './styles/textArea.module.css';

type TextAreaProps = ComponentProps<'textarea'> & {
  label?: string;
  error?: string;
  shouldFocus?: boolean;
  labelSibling?: React.ReactElement;
  containerStyles?: React.CSSProperties;
  inputStyles?: React.CSSProperties;
  labelStyles?: React.CSSProperties;
  labelClassName?: string;
  inputClassName?: string;
  resizeEnabled?: boolean;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
};

function TextArea(props: TextAreaProps) {
  const {
    id,
    name,
    label,
    placeholder,
    error,
    maxLength,
    shouldFocus = false,
    value,
    defaultValue,
    disabled,
    labelSibling,
    containerStyles,
    inputStyles,
    labelStyles,
    labelClassName,
    inputClassName,
    resizeEnabled = false,
    onChange,
    onKeyDown,
  } = props;

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (shouldFocus) {
      inputRef.current?.focus();
    }
  }, [shouldFocus]);

  return (
    <div
      className={clsx(styles.textArea, error !== undefined ? styles.inputError : null)}
      style={containerStyles}
    >
      <label htmlFor={id}>
        {label !== undefined ? (
          <div className={clsx(styles.label, labelClassName)} style={labelStyles}>
            <div>{label}</div>
            {labelSibling}
          </div>
        ) : null}
        <textarea
          id={id}
          ref={inputRef}
          name={name}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          maxLength={maxLength}
          onChange={onChange}
          onKeyDown={onKeyDown}
          style={inputStyles}
          autoComplete="off"
          className={clsx(inputClassName, resizeEnabled ? styles.resize : null)}
        />
        {error && <div className={styles.errorText}>{error}</div>}
      </label>
    </div>
  );
}

export { TextArea };
