import React from 'react';
import styles from './styles/selectInput.module.css';
import Select from 'react-select';

type SelectOption = {
  value: string;
  label: string;
} | null;

type SelectInputProps = {
  name: string;
  width?: number;
  label?: string;
  placeholder?: string;
  error?: string;
  value?: string;
  labelSibling?: React.ReactElement;
  options: SelectOption[];
  style?: React.CSSProperties;
  onChange?: (value: string) => void;
};

const BORDER_COLOR = '#cfcfcf';
const BORDER_FOCUS_COLOR = 'hsl(0, 0%, 70%)';
const PLACEHOLDER_COLOR = '#cfcfcf';
const OPTION_HOVER_COLOR = '#ebc8f9';
const OPTION_SELECTED_COLOR = '#702f8a';

function SelectInput(props: SelectInputProps) {
  const {
    name,
    width = 'auto',
    label,
    placeholder,
    error,
    value,
    labelSibling,
    options,
    style,
    onChange,
  } = props;

  const selectedOption = options.find((opt) => opt && opt.value === value);
  const containerStyles = { width, ...style };

  function handleChange(option: SelectOption) {
    if (!option) return;
    if (onChange) onChange(option.value);
  }

  return (
    <div className={styles.selectInput} style={containerStyles}>
      <label>
        {label !== '' && label !== undefined ? (
          <div className={styles.label}>
            <div>{label}</div>
            {labelSibling}
          </div>
        ) : null}
        <Select<SelectOption>
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
