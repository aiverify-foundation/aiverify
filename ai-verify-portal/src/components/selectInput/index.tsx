import React, { ChangeEvent } from 'react';
import styles from './styles/selectInput.module.css';
import Select from 'react-select';

type SelectOption<T = string> = {
  value: T;
  label: string;
} | null;

type SelectInputProps<valueType = string> = {
  id?: string;
  name: string;
  width?: number;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  value?: string;
  labelSibling?: React.ReactElement;
  options: SelectOption<valueType>[];
  style?: React.CSSProperties;
  selectedOptionPredicateFn?: (option: SelectOption<valueType>) => boolean;
  onChange?: (value: valueType) => void;
  // change handler to support formik's `handleChange` method. If this becomes unstable, use onChange prop with formik's `setFieldValue` method at the consumer
  onSyntheticChange?: (e: ChangeEvent<HTMLInputElement>) => void;
};

const BORDER_COLOR = '#cfcfcf';
const BORDER_FOCUS_COLOR = 'hsl(0, 0%, 70%)';
const PLACEHOLDER_COLOR = '#cfcfcf';
const OPTION_HOVER_COLOR = '#ebc8f9';
const OPTION_SELECTED_COLOR = '#702f8a';
const CONTROL_ENABLED_COLOR = '#ffffff';
const CONTROL_DISABLED_COLOR = '#f5f5f5';

function SelectInput<T = string>(props: SelectInputProps<T>) {
  const {
    id,
    name,
    width = 'auto',
    label,
    placeholder,
    disabled = false,
    error,
    value,
    labelSibling,
    options,
    style,
    selectedOptionPredicateFn,
    onSyntheticChange,
    onChange,
  } = props;

  const selectedOption = options.find(
    selectedOptionPredicateFn
      ? selectedOptionPredicateFn
      : (opt) => opt && opt.value === value
  );
  const containerStyles = { width, ...style };

  function handleChange(option: SelectOption<T>) {
    if (!option) return;
    /*
      To support formik's `handleChange` method, we shape an event object and cast it to react ChangeEvent<HTMLInputElement>. This seems to work.
      Alternatively, use `onChange` prop instead, and the handler passed to it can use formik's `setFieldValue`
    */
    if (onSyntheticChange && typeof option.value === 'string') {
      const syntheticEvent = {
        target: {
          name,
          value: option.value,
        },
      };
      onSyntheticChange(
        syntheticEvent as unknown as ChangeEvent<HTMLInputElement>
      );
      return;
    }
    if (onChange) onChange(option.value);
  }

  return (
    <div className={styles.selectInput} style={containerStyles} id={id}>
      <label htmlFor={name}>
        {label !== '' && label !== undefined ? (
          <div className={styles.label}>
            <div>{label}</div>
            {labelSibling}
          </div>
        ) : null}
        <Select<SelectOption<T>>
          styles={{
            container: (baseStyles) => ({
              ...baseStyles,
              width: '100%',
            }),
            control: (baseStyles, state) => ({
              ...baseStyles,
              minHeight: 30,
              fontSize: 16,
              lineHeight: 'normal',
              boxShadow: 'none',
              borderColor: state.isFocused ? BORDER_FOCUS_COLOR : BORDER_COLOR,
              '&:hover': {
                borderColor: BORDER_FOCUS_COLOR,
              },
              backgroundColor: state.isDisabled
                ? CONTROL_DISABLED_COLOR
                : CONTROL_ENABLED_COLOR,
            }),
            valueContainer: (baseStyles) => ({
              ...baseStyles,
              padding: '7px 8px',
            }),
            placeholder: (baseStyles) => ({
              ...baseStyles,
              lineHeight: 'normal',
              color: PLACEHOLDER_COLOR,
            }),
            indicatorSeparator: (baseStyles) => ({
              ...baseStyles,
              margin: 0,
            }),
            dropdownIndicator: (baseStyles) => ({
              ...baseStyles,
              padding: 7,
            }),
            input: (baseStyles) => ({
              ...baseStyles,
              padding: 0,
              margin: 0,
            }),
            option: (baseStyles, state) => ({
              ...baseStyles,
              backgroundColor: state.isSelected
                ? OPTION_SELECTED_COLOR
                : 'inherit',
              '&:hover': {
                backgroundColor: state.isSelected
                  ? OPTION_SELECTED_COLOR
                  : OPTION_HOVER_COLOR,
              },
            }),
          }}
          name={name}
          placeholder={placeholder}
          value={selectedOption}
          options={options}
          classNamePrefix="aiv"
          isDisabled={disabled}
          onChange={handleChange}
        />
        {Boolean(error) ? (
          <div className={styles.inputError}>{error}</div>
        ) : null}
      </label>
    </div>
  );
}

export { SelectInput };
export type { SelectOption };
