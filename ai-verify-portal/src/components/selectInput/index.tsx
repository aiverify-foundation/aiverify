import React, { ChangeEventHandler } from 'react';
import styles from './styles/selectInput.module.css';
import Select, { Options } from 'react-select';

type SelectOption = {
  value: string;
  label: string;
};

type SelectInputProps = {
  name: string;
  width?: number;
  label?: string;
  placeholder?: string;
  error?: string;
  value?: string;
  labelSibling?: React.ReactElement;
  options: Options<SelectOption>;
  onChange?: (option: any) => void;
};

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
    onChange,
  } = props;

  return (
    <div className={styles.selectInput} style={{ width }}>
      <label>
        <div className={styles.label}>
          <div>{label}</div>
          {labelSibling}
        </div>
        <Select
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
              borderColor: state.isFocused ? 'hsl(0, 0%, 70%)' : '#cfcfcf',
              '&:hover': {
                borderColor: 'hsl(0, 0%, 70%)',
              },
              boxShadow: 'none',
            }),
            valueContainer: (baseStyles) => ({
              ...baseStyles,
              padding: '7px 8px',
            }),
            placeholder: (baseStyles) => ({
              ...baseStyles,
              lineHeight: 'normal',
              color: '#676767',
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
              // lineHeight: 'normal',
            }),
          }}
          classNamePrefix="aiv"
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
