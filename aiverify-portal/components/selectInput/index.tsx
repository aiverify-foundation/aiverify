import React, { ChangeEvent } from 'react';
import Select from 'react-select';
import styles from './styles/selectInput.module.css';

type SelectOption<T = string> = {
  value: T;
  label: string;
} | null;

type SelectInputProps<valueType = string> = {
  id?: string;
  isMulti?: false | undefined;
  name: string;
  width?: number;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  value?: string;
  labelSibling?: React.ReactElement;
  options: SelectOption<valueType>[];
  style?: React.CSSProperties;
  inputBgColor?: string;
  inputStyle?: React.CSSProperties;
  labelStyles?: React.CSSProperties;
  selectedOptionPredicateFn?: (option: SelectOption<valueType>) => boolean;
  onChange?: (value: valueType) => void;
  // change handler to support formik's `handleChange` method. If this becomes unstable, use onChange prop with formik's `setFieldValue` method at the consumer
  onSyntheticChange?: (e: ChangeEvent<HTMLInputElement>) => void;
};

const BORDER_COLOR = '#cfcfcf';
const BORDER_FOCUS_COLOR = 'hsl(0, 0%, 70%)';
const PLACEHOLDER_COLOR = '#cfcfcf';
const OPTION_TEXT_COLOR = '#374151';
const OPTION_HOVER_COLOR = '#e5e7eb';
const OPTION_SELECTED_COLOR = '#d1d5db';
const CONTROL_ENABLED_COLOR = '#ffffff';
const CONTROL_DISABLED_COLOR = '#f5f5f5';

function SelectInput<T = string>(props: SelectInputProps<T>) {
  const {
    id,
    isMulti = false,
    name,
    width = 'auto',
    label,
    description,
    placeholder,
    disabled = false,
    error,
    value,
    labelSibling,
    options,
    style,
    inputBgColor,
    inputStyle,
    labelStyles,
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
    // For multi-select, option is an array of selected options
    if (Array.isArray(option)) {
      const values = option.map((opt) => (opt ? opt.value : null)); // Extract values from options
      // if (onChange) onChange(values as unknown as T); // Assuming onChange can handle T | T[]
      // return;
      if (onSyntheticChange) {
        const syntheticEvent = {
          target: {
            name,
            value: values,
          },
        };
        onSyntheticChange(
          syntheticEvent as unknown as ChangeEvent<HTMLInputElement>
        );
        return;
      }
    }
    // For single select, option is a single object
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
    <div
      className={styles.selectInput}
      style={containerStyles}>
      <label htmlFor={id}>
        {label !== '' && label !== undefined ? (
          <div
            className={styles.label}
            style={labelStyles}>
            <div>{label}</div>
            {labelSibling}
          </div>
        ) : null}
        {description !== '' && description !== undefined ? (
          <div className={styles.description}>{description}</div>
        ) : null}
        <Select<SelectOption<T>>
          inputId={id}
          styles={{
            container: (baseStyles) => ({
              ...baseStyles,
              width: '100%',
            }),
            control: (baseStyles, state) => ({
              ...baseStyles,
              minHeight: 30,
              fontSize: 14,
              lineHeight: 'normal',
              boxShadow: 'none',
              borderColor: state.isFocused ? BORDER_FOCUS_COLOR : BORDER_COLOR,
              '&:hover': {
                borderColor: BORDER_FOCUS_COLOR,
              },
              backgroundColor: state.isDisabled
                ? CONTROL_DISABLED_COLOR
                : inputBgColor || CONTROL_ENABLED_COLOR,
              ...inputStyle,
            }),
            menu: (baseStyles) => ({
              ...baseStyles,
              zIndex: 1000,
              borderRadius: 4,
            }),
            menuList: (baseStyles) => ({
              ...baseStyles,
              fontSize: 12,
              marginRight: 2,
              '::-webkit-scrollbar': {
                width: '0.5rem',
              },
              '::-webkit-scrollbar-track': {
                backgroundColor: 'rgb(229 231 235)',
              },
              '::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgb(156 163 175 / 0.8)',
                borderRadius: '0.375rem',
              },
              '::-webkit-scrollbar-thumb:hover': {
                backgroundColor: 'rgb(156 163 175 / 0.6)',
              },
            }),
            valueContainer: (baseStyles) => ({
              ...baseStyles,
              padding: '7px 8px',
            }),
            placeholder: (baseStyles) => ({
              ...baseStyles,
              fontSize: 14,
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
              fontSize: 14,
            }),
            option: (baseStyles, state) => ({
              ...baseStyles,
              fontSize: 14,
              backgroundColor: state.isSelected
                ? OPTION_SELECTED_COLOR
                : 'inherit',
              color: OPTION_TEXT_COLOR,
              '&:hover': {
                backgroundColor: state.isSelected
                  ? OPTION_SELECTED_COLOR
                  : OPTION_HOVER_COLOR,
                color: OPTION_TEXT_COLOR,
              },
            }),
            menuPortal: (base) => ({
              ...base,
              zIndex: 9999, // Ensure the menu is above other content
            }),
          }}
          name={name}
          isMulti={isMulti}
          placeholder={placeholder}
          value={selectedOption}
          options={options}
          classNamePrefix="aiv"
          isDisabled={disabled}
          menuPortalTarget={
            typeof document !== 'undefined' ? document.body : undefined
          }
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
