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
  value?: SelectOption;
  labelSibling?: React.ReactElement;
  options: SelectOption[];
  onChange?: (option: SelectOption) => void;
}

const BORDER_COLOR = '#cfcfcf';
const BORDER_FOCUS_COLOR = 'hsl(0, 0%, 70%)';
const FONT_COLOR = '#676767';
const PLACEHOLDER_COLOR = '#cfcfcf';

function SelectInput(props: SelectInputProps) {
  const {
    name,
    width = 'auto',
    label,
    placeholder = 'test',
    error,
    value,
    labelSibling,
    options,
    onChange,
  } = props;

  return (
    <div className={styles.selectInput} style={{ width }}>
      <label>
        <div className={styles.label}>
          <div>{label}</div>
          {labelSibling}
        </div>
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
          }}
          name={name}
          placeholder={placeholder}
          value={value}
          options={options}
          onChange={onChange}
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

