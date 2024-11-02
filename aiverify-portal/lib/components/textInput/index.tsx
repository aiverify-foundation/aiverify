import clsx from 'clsx';
import React, {
  ChangeEventHandler,
  ComponentProps,
  FocusEventHandler,
  KeyboardEventHandler,
  useEffect,
  useRef,
} from 'react';
import styles from './styles/textInput.module.css';

type TextInputProps = ComponentProps<'input'> & {
  label?: string;
  description?: React.ReactNode;
  error?: string;
  shouldFocus?: boolean;
  labelSibling?: React.ReactElement;
  inputStyles?: React.CSSProperties;
  labelStyles?: React.CSSProperties;
  labelClassName?: string;
  inputClassName?: string;
  descriptionStyles?: React.CSSProperties;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
};

function TextInput(props: TextInputProps) {
  const {
    id,
    name,
    label,
    description,
    placeholder,
    type = 'text',
    min,
    max,
    step,
    disabled,
    error,
    maxLength,
    shouldFocus = false,
    value,
    defaultValue,
    labelSibling,
    style,
    inputStyles,
    labelStyles,
    descriptionStyles,
    labelClassName,
    inputClassName,
    onChange,
    onBlur,
    onKeyDown,
    onFocus,
  } = props;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shouldFocus) {
      inputRef.current?.focus();
    }
  }, [shouldFocus]);

  return (
    <div
      className={clsx(styles.textInput, error !== undefined ? styles.inputError : null)}
      style={style}
    >
      <label htmlFor={id}>
        {label !== '' && label !== undefined ? (
          <div className={clsx(styles.label, labelClassName)} style={labelStyles}>
            <div>{label}</div>
            {labelSibling}
          </div>
        ) : null}
        {description ? (
          <div className={styles.description} style={descriptionStyles}>
            {description}
          </div>
        ) : null}
        <input
          id={id}
          ref={inputRef}
          disabled={disabled}
          type={type}
          name={name}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          style={inputStyles}
          autoComplete="off"
          className={inputClassName}
        />
        {error ? <div className={styles.errorText}>{error}</div> : null}
      </label>
    </div>
  );
}

export { TextInput };
