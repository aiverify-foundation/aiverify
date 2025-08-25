'use client';

import Form from '@rjsf/core';
import {
  RJSFSchema,
  UiSchema,
  FieldTemplateProps,
  ArrayFieldTemplateProps,
  ArrayFieldTemplateItemType,
  WidgetProps,
  ErrorSchema,
  WrapIfAdditionalTemplateProps,
  ADDITIONAL_PROPERTY_FLAG,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
// import { parseRJSFSchema } from 'aiverify-shared-library/lib/';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef, useMemo, use } from 'react';
import useSubmitTest from '@/app/results/run/hooks/useSubmitTest';
import { Algorithm, Plugin } from '@/app/types';
import { Dataset } from '@/app/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { TestRunInput } from '@/lib/fetchApis/getTestRunApis';
import ServerStatusModal from './ServerStatusModal';
import type { FormProps, IChangeEvent } from '@rjsf/core';
import './form-styles.css';

// Create a custom text widget that handles its own state
function CustomTextWidget(props: WidgetProps) {
  const {
    id,
    value,
    onChange,
    required,
    label,
    placeholder,
    disabled,
    readonly,
  } = props;
  const [inputValue, setInputValue] = useState(value || '');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the value
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    // Update local state immediately (no focus loss)
    setInputValue(newValue);

    // Debounce the update to parent
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <input
      id={id}
      className="w-full rounded-md border border-secondary-600 bg-secondary-800 p-2 text-white"
      value={inputValue}
      placeholder={placeholder || ''}
      onChange={handleChange}
      disabled={disabled || readonly}
      required={required}
      aria-label={label}
    />
  );
}

// Custom select widget to ensure full option text is visible
function CustomSelectWidget(props: WidgetProps) {
  const {
    id,
    options,
    value,
    required,
    disabled,
    readonly,
    onChange,
    placeholder,
    label,
  } = props;

  // TypeScript interface for options
  interface SelectOption {
    value: string | number;
    label: string;
  }

  // Extract enumOptions from options
  let enumOptions = (options.enumOptions || []) as SelectOption[];
  
  // If no custom enumOptions provided, create from enum values
  if (enumOptions.length === 0 && options.enumNames && options.enumNames.length > 0) {
    const optionsWithEnum = options as typeof options & { enumValues?: (string | number)[] };
    enumOptions = options.enumNames.map((name: string, index: number) => ({
      label: name,
      value: optionsWithEnum.enumValues?.[index] || name,
    }));
  }
  
  const emptyValue = options.emptyValue;

  // State for dropdown open/close and keyboard navigation
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Fix for ref callback TypeScript error
  const setOptionRef = (index: number) => (el: HTMLDivElement | null) => {
    optionRefs.current[index] = el;
    // No return value (void)
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const newIndex = Math.min(prev + 1, enumOptions.length - 1);
            scrollOptionIntoView(newIndex);
            return newIndex;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const newIndex = Math.max(prev - 1, -1);
            scrollOptionIntoView(newIndex);
            return newIndex;
          });
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0) {
            handleOptionSelect(enumOptions[focusedIndex].value);
          } else if (focusedIndex === -1 && placeholder) {
            handleOptionSelect('');
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, focusedIndex, enumOptions]);

  // Scroll focused option into view
  const scrollOptionIntoView = (index: number) => {
    if (index < 0 || !menuRef.current) return;

    const option = optionRefs.current[index];
    if (option) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const optionRect = option.getBoundingClientRect();

      // If option is above visible area of menu
      if (optionRect.top < menuRect.top) {
        menuRef.current.scrollTop = option.offsetTop;
      }
      // If option is below visible area of menu
      else if (optionRect.bottom > menuRect.bottom) {
        menuRef.current.scrollTop =
          option.offsetTop - (menuRect.height - option.offsetHeight);
      }
    }
  };

  // Get selected option label
  const selectedOption = enumOptions.find(
    (option: SelectOption) => option.value === value
  );
  // console.log(value, selectedOption);
  const displayValue = selectedOption
    ? selectedOption.label
    : placeholder || '-- Select --';

  // Handle option selection
  const handleOptionSelect = (optionValue: string | number) => {
    onChange(optionValue === '' ? emptyValue : optionValue);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  // Toggle dropdown open/close
  const toggleDropdown = () => {
    if (!disabled && !readonly) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // When opening, set focus to the selected item
        const selectedIndex = enumOptions.findIndex(
          (opt) => opt.value === value
        );
        setFocusedIndex(selectedIndex >= 0 ? selectedIndex : -1);

        // Need to wait for the dropdown to render before scrolling
        setTimeout(() => {
          scrollOptionIntoView(selectedIndex);
        }, 0);
      }
    }
  };

  // Calculate if menu should open upwards
  const [openUpward, setOpenUpward] = useState(false);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = Math.min(
        300,
        (enumOptions.length + (placeholder ? 1 : 0)) * 42
      );

      if (spaceBelow < menuHeight && rect.top > menuHeight) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen, enumOptions.length]);

  return (
    <div
      ref={dropdownRef}
      className="custom-dropdown">
      {/* Dropdown trigger button */}
      <button
        type="button"
        id={id}
        className="custom-dropdown-button"
        onClick={toggleDropdown}
        disabled={disabled || readonly}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}>
        <span className="custom-dropdown-selected-text">{displayValue}</span>
        <svg
          className="custom-dropdown-arrow"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown options list */}
      {isOpen && (
        <div
          ref={menuRef}
          className="custom-dropdown-menu"
          role="listbox"
          style={{
            top: openUpward ? 'auto' : 'calc(100% + 4px)',
            bottom: openUpward ? 'calc(100% + 4px)' : 'auto',
          }}>
          {placeholder && emptyValue !== undefined && (
            <div
              ref={setOptionRef(-1)}
              role="option"
              className={`custom-dropdown-option ${value === emptyValue ? 'selected' : ''} ${focusedIndex === -1 ? 'focused' : ''}`}
              aria-selected={value === emptyValue}
              tabIndex={0}
              onClick={() => handleOptionSelect('')}
              onMouseEnter={() => setFocusedIndex(-1)}>
              {placeholder}
            </div>
          )}

          {enumOptions.map((option: SelectOption, index: number) => (
            <div
              key={option.value}
              ref={setOptionRef(index)}
              role="option"
              className={`custom-dropdown-option ${value === option.value ? 'selected' : ''} ${focusedIndex === index ? 'focused' : ''}`}
              aria-selected={value === option.value}
              tabIndex={0}
              onClick={() => handleOptionSelect(option.value)}
              onMouseEnter={() => setFocusedIndex(index)}>
              {option.label}
            </div>
          ))}
        </div>
      )}

      {/* Hidden native select for form submission */}
      <select
        id={`${id}-hidden`}
        name={id}
        value={value || ''}
        required={required}
        disabled={disabled || readonly}
        onChange={() => {}} // Do nothing as we handle changes in our custom UI
        style={{ display: 'none' }} // Hide this element
        aria-hidden="true">
        {placeholder && <option value="">{placeholder}</option>}
        {enumOptions.map((option: SelectOption) => (
          <option
            key={option.value}
            value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const WrapIfAdditionalTemplate = (props: WrapIfAdditionalTemplateProps) => {
  const {
    id,
    label,
    onKeyChange,
    onDropPropertyClick,
    schema,
    children,
    uiSchema,
    registry,
    classNames,
    style,
  } = props;
  const { RemoveButton } = registry.templates.ButtonTemplates;
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return <div>{children}</div>;
  }

  return (
    <div
      className={classNames}
      style={style}>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 mt-2">
          <input
            className="form-control"
            type="text"
            id={`${id}-key`}
            onBlur={function (event) {
              onKeyChange(event.target.value);
            }}
            defaultValue={label}
          />
        </div>
        <div className="form-additional col-span-5">{children}</div>
        <div className="col-span-2 mt-2">
          <button
            type="button"
            className="ml-2 rounded bg-[var(--color-danger)] px-2 py-1 text-white"
            onClick={onDropPropertyClick(label)}>
            ✕
          </button>
        </div>
        {/* <RemoveButton
          onClick={onDropPropertyClick(label)}
          uiSchema={uiSchema}
        /> */}
      </div>
    </div>
  );
};

// Custom field templates to handle specific fields
const customFieldTemplate = (props: FieldTemplateProps) => {
  const { id, label, required, children, rawErrors, schema, uiSchema, hidden } =
    props;

  // Don't render labels for array items as they'll get their own labels
  const isArrayItem =
    id.includes('_') &&
    id.split('_').length > 2 &&
    !isNaN(Number(id.split('_').pop()));

  if (hidden) {
    return <div className="hidden">{children}</div>;
  }

  // Skip rendering labels for array fields since they're handled by ArrayFieldTemplate
  // const isArray = schema.type === 'array';

  // Skip rendering labels for array items or nested objects
  // if (isArrayItem || isArray) {
  //   // return <div className="w-full">{children}</div>;
  //   return (
  //     <WrapIfAdditionalTemplate {...props}>
  //       <div className="w-full">{children}</div>
  //     </WrapIfAdditionalTemplate>
  //   );
  // }

  // Default rendering for all other fields
  return (
    <WrapIfAdditionalTemplate {...props}>
      <div className="mb-4">
        {!uiSchema?.['ui:hidden'] && (
          <label className="mb-2 block font-medium text-white">
            {schema.title || label}
            {required && (
              <span className="ml-1 text-[var(--color-danger)]">*</span>
            )}
          </label>
        )}
        {schema.description && (
          <p className="mb-1 mt-1 text-sm text-[var(--color-primary-300)]">
            {schema.description}
          </p>
        )}
        {children}

        {/* {rawErrors && rawErrors.length > 0 && (
            <div className="mt-1 text-sm text-[var(--color-danger)]">
              {rawErrors.map((error: string, i: number) => (
                <div key={i}>{error}</div>
              ))}
            </div>
          )} */}
      </div>
    </WrapIfAdditionalTemplate>
  );
};

// Custom array field template
const customArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  // console.log('props:', props);
  return (
    <div className="array-field-container">
      {/* {props.canAdd && (
          <div className="array-field-title mb-2">
            <span className="font-medium text-white">{props.title}</span>
            {props.required && (
              <span className="ml-1 text-[var(--color-danger)]">*</span>
            )}
          </div>
        )}
        {props.schema.description && (
          <p className="mt-1 text-sm text-[var(--color-primary-300)]">
            {props.schema.description}
          </p>
        )} */}
      {props.items.map((element: ArrayFieldTemplateItemType) => (
        <div
          key={element.key}
          className="flex space-x-2">
          <div className="w-[80%]">{element.children}</div>
          {element.hasRemove && (
            <div className="mt-9 flex-none">
              <button
                type="button"
                className="ml-2 rounded bg-[var(--color-danger)] px-2 py-1 text-white"
                onClick={element.onDropIndexClick(element.index)}>
                ✕
              </button>
            </div>
          )}
        </div>
      ))}
      {props.canAdd && (
        <button
          type="button"
          className="mb-2 mt-2 rounded bg-[var(--color-primary-500)] px-3 py-1 text-white"
          onClick={props.onAddClick}>
          + Add
        </button>
      )}
    </div>
  );
};

interface TestRunFormProps {
  plugins: Plugin[];
  models: Array<{ filename: string; name: string }>;
  datasets: Dataset[];
  initialServerActive: boolean;
  preselectedModel?: { id: number; name: string; filename: string };
  projectId?: string;
  flow?: string;
}

interface FormState {
  algorithm?: string;
  model?: string;
  testDataset?: string;
  groundTruthDataset?: string;
  groundTruth?: string;
  // algorithmArgs?: Record<string, unknown>;
}

// Utility function to process algorithm arguments according to input schema
const processAlgorithmArgs = (
  args: Record<string, unknown> | undefined,
  schema: RJSFSchema
): Record<string, unknown> => {
  // If no schema or no properties, return args as is or empty object
  if (!schema || !schema.properties) {
    console.debug(
      'No schema or properties found, returning args as is:',
      args || {}
    );
    return args || {};
  }

  console.debug('Processing algorithm args with schema:', {
    originalArgs: args,
    schemaProperties: schema.properties,
    schemaRequired: schema.required,
  });

  // Start with provided args or empty object
  const processedArgs: Record<string, unknown> = args ? { ...args } : {};

  // Get the list of required properties
  const requiredProps: string[] = Array.isArray(schema.required)
    ? schema.required
    : [];

  // Process each property in the schema
  Object.entries(
    schema.properties as Record<string, Record<string, unknown>>
  ).forEach(([propName, propSchema]) => {
    // Skip if it's not a valid schema object
    if (typeof propSchema !== 'object' || propSchema === null) return;

    const isRequired = requiredProps.includes(propName);
    const initialValue = processedArgs[propName];

    if (processedArgs[propName] === undefined) {
      // Handle when property is not provided by user
      // If there's a default value, use it
      if ('default' in propSchema) {
        processedArgs[propName] = propSchema.default;
        console.debug(
          `Applied default value for ${propName}:`,
          propSchema.default
        );
      }
      // For optional array types with union type ["array", "null"], use null
      else if (
        !isRequired &&
        Array.isArray(propSchema['type']) &&
        propSchema.type.includes('array') &&
        propSchema.type.includes('null')
      ) {
        processedArgs[propName] = null;
        console.debug(`Set null for optional array ${propName} (not provided)`);
      }
      // For other optional properties, leave them undefined (they'll be omitted)
    }

    // if selectDataset, then add "_dataset_:" to dataset filename
    if (
      propSchema &&
      'selectDataset' in propSchema &&
      processedArgs[propName] !== undefined
    ) {
      processedArgs[propName] = '_dataset_:' + processedArgs[propName];
    }

    // Special handling for empty arrays - if user explicitly provided an empty array
    // for a non-required field that accepts null, consider if we should convert to null
    // (This is debatable and depends on your API expectations)
    if (
      !isRequired &&
      Array.isArray(processedArgs[propName]) &&
      (processedArgs[propName] as unknown[]).length === 0 &&
      Array.isArray(propSchema.type) &&
      propSchema.type.includes('null')
    ) {
      // Here we keep empty arrays as is, but you could set to null if that's preferred
      // processedArgs[propName] = null;
      console.debug(
        `Empty array detected for ${propName}, keeping as empty array`
      );
    }

    // Log if value changed
    if (initialValue !== processedArgs[propName]) {
      console.debug(`${propName} value changed:`, {
        from: initialValue,
        to: processedArgs[propName],
        required: isRequired,
        schemaType: propSchema.type,
      });
    }
  });

  console.debug('Final processed args:', processedArgs);
  return processedArgs;
};

export default function TestRunForm({
  plugins,
  models,
  datasets,
  initialServerActive,
  preselectedModel,
  projectId,
  flow,
}: TestRunFormProps) {
  const router = useRouter();
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(
    null
  );
  const [allAlgorithms, setAllAlgorithms] = useState<
    Array<Algorithm & { pluginGid: string }>
  >([]);
  const [formData, setFormData] = useState<FormState>({
    // algorithmArgs: {},
  });
  const [algorithmArgs, setAlgorithmArgs] = useState<Record<string, unknown>>(
    {}
  );
  const [error, setError] = useState<string | null>(null);
  const [isServerActive] = useState<boolean>(initialServerActive);
  const [showModal, setShowModal] = useState(!initialServerActive);

  // Add form validation state
  const [isMainFormValid, setIsMainFormValid] = useState<boolean>(false);
  const [isAlgorithmFormValid, setIsAlgorithmFormValid] =
    useState<boolean>(true); // Default to true as it might not be required
  const [mainFormErrors, setMainFormErrors] = useState<ErrorSchema | undefined>(
    undefined
  );
  const [algorithmFormErrors, setAlgorithmFormErrors] = useState<
    ErrorSchema | undefined
  >(undefined);

  // Debounce timers for handling text input
  const mainFormTimer = useRef<NodeJS.Timeout | null>(null);
  const algorithmFormTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize the submit test mutation
  const { mutate: submitTest, isPending } = useSubmitTest({
    onSuccess: (data) => {
      console.log('Test submitted successfully:', data);
      // Always redirect to view tests page, but preserve project context in URL parameters
      if (projectId && flow) {
        router.push(
          `/results/run/view_tests?projectId=${projectId}&flow=${flow}`
        );
      } else {
        router.push('/results/run/view_tests');
      }
    },
    onError: (err: Error) => {
      console.error('Error submitting test:', err);
      setError(formatErrorMessage(err.message));
    },
  });

  // Format error message to be more user-friendly
  const formatErrorMessage = (errorMsg: string): string => {
    try {
      // Check if the error message contains a JSON string
      if (errorMsg.includes('{') && errorMsg.includes('}')) {
        // Extract the main error message before the JSON
        const mainMessage = errorMsg.split('{')[0].trim();

        // Parse the JSON part - using a different approach to get JSON string without 's' flag
        let jsonStr = '';
        const startIndex = errorMsg.indexOf('{');
        const endIndex = errorMsg.lastIndexOf('}') + 1;

        if (startIndex >= 0 && endIndex > startIndex) {
          jsonStr = errorMsg.substring(startIndex, endIndex);
          try {
            const errorObj = JSON.parse(jsonStr);

            // Check for nested details
            if (
              errorObj.details &&
              typeof errorObj.details === 'string' &&
              errorObj.details.includes('{')
            ) {
              try {
                const detailsObj = JSON.parse(errorObj.details);
                return `${mainMessage}: ${detailsObj.detail || errorObj.error || 'Unknown error'}`;
              } catch {
                // If nested JSON parsing fails, return the error message or details
                return `${mainMessage}: ${errorObj.error || errorObj.details || 'Unknown error'}`;
              }
            }

            // Return formatted message with error from JSON
            return `${mainMessage}: ${errorObj.error || errorObj.details || errorObj.detail || 'Unknown error'}`;
          } catch (parseError) {
            // JSON parsing failed
            console.error('Error parsing JSON in error message:', parseError);
          }
        }
      }

      // If not a JSON-containing error or parsing fails, return the original message
      return errorMsg;
    } catch (e) {
      console.error('Error formatting error message:', e);
      return errorMsg; // Return original on any error
    }
  };

  // Log for debugging
  useEffect(() => {
    console.log('Plugins available:', plugins);
  }, [plugins]);

  // Initialize all algorithms from all plugins
  useEffect(() => {
    // Combine algorithms from all plugins
    const allAlgos = plugins.flatMap((plugin) =>
      plugin.algorithms.map((algo) => ({
        ...algo,
        pluginGid: plugin.gid,
      }))
    );

    console.log('All algorithms:', allAlgos);
    setAllAlgorithms(allAlgos);

    // Pre-select algorithm if only one is available (e.g., when coming from project flow)
    if (allAlgos.length === 1 && !formData.algorithm) {
      setFormData((prev) => ({
        ...prev,
        algorithm: allAlgos[0].cid,
      }));
    }
  }, [plugins, formData.algorithm]);

  // Pre-select model if provided
  useEffect(() => {
    if (preselectedModel && !formData.model) {
      setFormData((prev) => ({
        ...prev,
        model: preselectedModel.filename,
      }));
    }
  }, [preselectedModel, formData.model]);

  // Update selected algorithm when algorithm selection changes
  useEffect(() => {
    if (formData.algorithm) {
      setSelectedAlgorithm(formData.algorithm);

      // Find the selected algorithm to get its input schema
      const selectedAlgo = allAlgorithms.find(
        (algo) => algo.cid === formData.algorithm
      );

      if (selectedAlgo && selectedAlgo.inputSchema) {
        // Initialize algorithm args with default values from schema
        const schema = selectedAlgo.inputSchema as RJSFSchema;
        const initialArgs: Record<string, unknown> = {};

        // If schema has properties, extract default values
        if (schema.properties) {
          Object.entries(schema.properties).forEach(
            ([propName, propSchema]) => {
              // Skip if it's not a valid schema object
              if (typeof propSchema !== 'object' || propSchema === null) return;

              // If property has a default value, use it for initialization
              if ('default' in propSchema) {
                initialArgs[propName] = propSchema.default;
              }
            }
          );
        }

        // Only update if we have default values to set and user hasn't set any values yet
        if (
          Object.keys(initialArgs).length > 0 &&
          Object.keys(algorithmArgs).length === 0
        ) {
          // setFormData((prev) => ({
          //   ...prev,
          //   algorithmArgs: initialArgs,
          // }));
          setAlgorithmArgs(initialArgs);
        }
      }
    } else {
      setSelectedAlgorithm(null);
    }
  }, [formData.algorithm, allAlgorithms]);

  // Debounced form change handler with validation
  const handleFormChange = (e: IChangeEvent) => {
    const newFormData = e.formData as FormState;

    // Check if the form is valid (no errors)
    const isValid = e.errors?.length === 0;
    setIsMainFormValid(isValid);
    setMainFormErrors(e.errorSchema);

    setFormData(newFormData);

    // // Check if this is a dropdown or text field
    // const isDropdown =
    //   newFormData &&
    //   (formData.algorithm !== newFormData.algorithm ||
    //     formData.model !== newFormData.model ||
    //     formData.testDataset !== newFormData.testDataset ||
    //     formData.groundTruthDataset !== newFormData.groundTruthDataset);

    // // For dropdowns, update immediately
    // if (isDropdown) {
    //   setFormData(newFormData);
    //   return;
    // }

    // // For text fields, debounce updates
    // if (mainFormTimer.current) {
    //   clearTimeout(mainFormTimer.current);
    // }

    // mainFormTimer.current = setTimeout(() => {
    //   setFormData(newFormData);
    // }, 500);
  };

  // Debounced algorithm param change handler with validation
  const handleAlgorithmParamChange = (e: IChangeEvent) => {
    // Check if the algorithm parameters form is valid
    const isValid = e.errors?.length === 0;
    if (isValid != isAlgorithmFormValid) {
      setIsAlgorithmFormValid(isValid);
    }
    if (e.errorSchema !== algorithmFormErrors) {
      setAlgorithmFormErrors(e.errorSchema);
    }
    setAlgorithmArgs(e.formData);
    // const algorithmArgs = e.formData as Record<string, unknown>;
    // if (algorithmArgs) {
    //   setAlgorithmArgs((prev) => ({
    //     ...prev,
    //     algorithmArgs,
    //   }));
    // }

    // if (algorithmFormTimer.current) {
    //   clearTimeout(algorithmFormTimer.current);
    // }

    // // For algorithm parameters, use debouncing
    // algorithmFormTimer.current = setTimeout(() => {
    //   const algorithmArgs = e.formData as Record<string, unknown>;
    //   if (algorithmArgs) {
    //     setFormData((prev) => ({
    //       ...prev,
    //       algorithmArgs,
    //     }));
    //   }
    // }, 500);
  };

  const selectedTestDataset: Dataset | null = useMemo(() => {
    if (formData.testDataset) {
      const testDataset = datasets.find(
        (x) => x.filename === formData.testDataset
      );
      return testDataset || null;
    } else {
      return null;
    }
  }, [formData.testDataset]);

  const selectedGroundTruthDataset: Dataset | null = useMemo(() => {
    if (formData.groundTruthDataset) {
      const groundTruthDataset = datasets.find(
        (x) => x.filename === formData.groundTruthDataset
      );
      return groundTruthDataset || null;
    } else if (selectedTestDataset) {
      return selectedTestDataset;
    } else {
      return null;
    }
  }, [formData.groundTruthDataset, selectedTestDataset]);

  // Schema for test selection (plugin, algorithm, model, dataset)
  const selectionSchema: RJSFSchema = useMemo(() => {
    let groundTruthEnum: string[] = [];
    if (selectedGroundTruthDataset && selectedGroundTruthDataset.dataColumns) {
      groundTruthEnum = selectedGroundTruthDataset.dataColumns.map(
        (x) => x.name
      );
    }
    const schema: RJSFSchema = {
      type: "object",
      required: ['algorithm', 'model', 'testDataset'],
      properties: {
        algorithm: {
          type: "string",
          title: 'Algorithm',
          enum: allAlgorithms.map((algo) => algo.cid),
          enumNames: allAlgorithms.map((algo) => algo.name),
        },
        model: {
          type: "string",
          title: 'Model',
          enum: models.map((model) => model.filename),
        },
        testDataset: {
          type: "string",
          title: 'Test Dataset',
          enum: datasets.map((dataset) => dataset.filename),
        },
        groundTruthDataset: {
          type: "string",
          title: 'Ground Truth Dataset',
          description:
            'If not selected, the test dataset will be used as the ground truth dataset',
          enum: datasets.map((dataset) => dataset.filename),
        },
        groundTruth: {
          type: "string",
          title: 'Ground Truth Column',
          description:
            'The column name in the dataset that contains the ground truth values',
          enum: groundTruthEnum,
        },
      },
    };
    return schema;
  }, [allAlgorithms, models, datasets, selectedGroundTruthDataset]);

  // UI Schema for form display - configure custom widgets
  const uiSchema: UiSchema = useMemo(() => {
    const schema = {
      'ui:order': [
        'algorithm',
        'model',
        'testDataset',
        'groundTruthDataset',
        'groundTruth',
        '*',
      ],
      algorithm: {
        'ui:placeholder': '-- Select an Algorithm --',
        'ui:emptyValue': '',
        'ui:widget': 'CustomSelectWidget',
        'ui:enumOptions': allAlgorithms.map((algo) => ({
          label: algo.name,
          value: algo.cid,
        })),
      },
      model: {
        'ui:placeholder': '-- Select a Model --',
        'ui:emptyValue': '',
        'ui:widget': 'CustomSelectWidget',
        'ui:enumOptions': models.map((model) => ({
          label: model.name,
          value: model.filename,
        })),
      },
      testDataset: {
        'ui:placeholder': '-- Select a Test Dataset --',
        'ui:emptyValue': '',
        'ui:widget': 'CustomSelectWidget',
        'ui:enumOptions': datasets.map((dataset) => ({
          label: dataset.name,
          value: dataset.filename,
        })),
      },
      groundTruthDataset: {
        'ui:placeholder': '-- Select a Ground Truth Dataset --',
        'ui:emptyValue': '',
        'ui:widget': 'CustomSelectWidget',
        'ui:enumOptions': [
          { label: 'Same as Test Dataset', value: '' },
          ...datasets.map((dataset) => ({
            label: dataset.name,
            value: dataset.filename,
          })),
        ],
      },
      groundTruth: {
        'ui:placeholder': 'Enter column name',
        'ui:emptyValue': '',
        // 'ui:widget': 'CustomTextWidget',
        'ui:widget': 'CustomSelectWidget',
        'ui:enumOptions':
          selectedGroundTruthDataset && selectedGroundTruthDataset.dataColumns
            ? selectedGroundTruthDataset.dataColumns.map((x) => ({
                label: x.label,
                value: x.name,
              }))
            : [],
      },
    };
    return schema;
  }, [selectionSchema]);

  // Create a map of custom widgets
  const widgets = {
    CustomTextWidget: CustomTextWidget,
    CustomSelectWidget: CustomSelectWidget,
  };

  // Get algorithm input schema
  const algorithmParamsSchema: RJSFSchema = useMemo(() => {
    if (!selectedAlgorithm)
      return { type: 'object', properties: {} } as RJSFSchema;

    const algo = allAlgorithms.find((a) => a.cid === selectedAlgorithm);
    if (!algo) return { type: 'object', properties: {} };

    const schema = { ...algo.inputSchema } as RJSFSchema;
    
    // Handle properties safely
    if (schema.properties) {
      // Create a safe copy of the properties to work with
      const properties = { ...schema.properties };
      
      // Iterate through properties safely
      for (const propName of Object.keys(properties)) {
        const prop = properties[propName] as RJSFSchema;
        
        if (prop && typeof prop === 'object' && 'ui:widget' in prop) {
          const uiWidget = prop['ui:widget'];
          
          if (uiWidget === 'selectDataset') {
            // Create a new enum array with proper typing
            const datasetEnums: string[] = datasets.map((dataset) => dataset.filename);
            
            // Handle default value safely
            if ('default' in prop && prop['default'] !== undefined && prop['default'] !== null) {
              const defaultValue = String(prop['default']);
              prop['enum'] = [defaultValue, ...datasetEnums];
            } else {
              prop['enum'] = datasetEnums;
            }
            
            prop['selectDataset'] = 1;
          } else if (uiWidget === 'selectTestDataFeature') {
            if (selectedTestDataset && selectedTestDataset.dataColumns) {
              prop['enum'] = selectedTestDataset.dataColumns.map((x) => x.name);
            } else {
              prop['enum'] = [];
            }
          }
        }
      }
      
      // Update the schema with our safely modified properties
      schema.properties = properties;
    }

    return schema;
  }, [selectedAlgorithm, selectedTestDataset, datasets]);

  // Get algorithm UI schema
  const algorithmUISchema: UiSchema = useMemo(() => {
    // Create a UI schema that applies CustomTextWidget to all string inputs without enum
    const schema = algorithmParamsSchema;
    if (!schema.properties) return {};

    const uiSchema: UiSchema = {};

    // Iterate through properties safely
    for (const propName of Object.keys(schema.properties)) {
      const prop = schema.properties[propName] as RJSFSchema;
      
      if (prop && typeof prop === 'object' && 'ui:widget' in prop) {
        const uiWidget = prop['ui:widget'];
        
        if (uiWidget === 'selectDataset') {
          const enumOptions = [];
          
          // Handle default value safely
          if ('default' in prop && prop['default'] !== undefined && prop['default'] !== null) {
            const defaultValue = prop['default'];
            let defaultLabel = '';
            
            // Handle different types of default values
            if (typeof defaultValue === 'string' && defaultValue.length > 0) {
              defaultLabel = defaultValue;
            } else if (defaultValue !== null) {
              defaultLabel = String(defaultValue);
            }
            
            enumOptions.push({
              label: defaultLabel,
              value: defaultValue
            });
          }
          
          // Add dataset options
          datasets.forEach(dataset => {
            enumOptions.push({
              label: dataset.name,
              value: dataset.filename
            });
          });
          
          uiSchema[propName] = {
            'ui:placeholder': `-- Select ${prop.title || propName} --`,
            'ui:widget': 'CustomSelectWidget',
            'ui:enumOptions': enumOptions
          };
        } else if (uiWidget === 'selectTestDataFeature') {
          const enumOptions =
            selectedTestDataset && selectedTestDataset.dataColumns
              ? selectedTestDataset.dataColumns.map((x) => ({
                  label: x.label,
                  value: x.name,
                }))
              : [];
          uiSchema[propName] = {
            'ui:widget': 'CustomSelectWidget',
            'ui:emptyValue': '',
            'ui:enumOptions': enumOptions,
          };
        }
      } else if (prop && typeof prop === 'object' && prop.type === 'string') {
        if (prop.enum) {
          // For dropdowns (enum), use our custom select widget
          uiSchema[propName] = {
            'ui:widget': 'CustomSelectWidget',
          };
        } else {
          // For text inputs, use our custom text widget
          uiSchema[propName] = {
            'ui:widget': 'CustomTextWidget',
          };
        }
      }
    }

    return uiSchema;
  }, [algorithmParamsSchema, datasets, selectedTestDataset]);

  // Check if algorithm has parameters
  const hasAlgorithmParameters = useMemo((): boolean => {
    const schema = algorithmParamsSchema;
    return !!(
      schema &&
      schema.properties &&
      Object.keys(schema.properties).length > 0
    );
  }, [selectedAlgorithm]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setError(null);

      const submitData = {
        ...formData,
        algorithmArgs,
      };

      // Check if server is active
      if (!isServerActive) {
        setShowModal(true);
        return;
      }

      if (!submitData.algorithm) {
        throw new Error('Please select an algorithm');
      }

      // If groundTruthDataset is empty, use testDataset
      if (!submitData.groundTruthDataset) {
        submitData.groundTruthDataset = submitData.testDataset;
      }

      // Find the selected algorithm to get its plugin ID
      const selectedAlgo = allAlgorithms.find(
        (algo) => algo.cid === submitData.algorithm
      );

      if (!selectedAlgo) {
        throw new Error('Selected algorithm not found');
      }

      submitData.algorithmArgs = algorithmArgs;

      // Process algorithm args according to input schema
      const processedArgs = processAlgorithmArgs(
        submitData.algorithmArgs,
        selectedAlgo.inputSchema as RJSFSchema
      );

      // Log differences between original and processed args
      console.log('Algorithm arguments processing:', {
        original: submitData.algorithmArgs || {},
        processed: processedArgs,
        hasDifferences:
          JSON.stringify(submitData.algorithmArgs || {}) !==
          JSON.stringify(processedArgs),
      });

      // Prepare input data
      const inputData: TestRunInput = {
        mode: 'upload',
        algorithmGID: selectedAlgo.pluginGid,
        algorithmCID: submitData.algorithm,
        algorithmArgs: processedArgs,
        modelFilename: submitData.model || '',
        testDatasetFilename: submitData.testDataset || '',
        groundTruthDatasetFilename: submitData.groundTruthDataset,
        groundTruth: submitData.groundTruth,
      };

      console.log('Submitting test with data:', inputData);

      // Submit the test using our hook
      submitTest(inputData);

      // Note: No need to redirect here as it's handled in the onSuccess callback
    } catch (err) {
      console.error('Form submission error:', err);
      setError((err as Error).message);
    }
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (mainFormTimer.current) clearTimeout(mainFormTimer.current);
      if (algorithmFormTimer.current) clearTimeout(algorithmFormTimer.current);
    };
  }, []);

  useEffect(() => {
    setAlgorithmArgs({});
  }, [selectedAlgorithm]);

  // Get missing required fields
  const getMissingFieldsMessage = (): string => {
    const missingFields: string[] = [];

    // Check main form errors
    if (mainFormErrors) {
      // Check for required fields in main form
      if (
        mainFormErrors.algorithm?.__errors?.includes('is a required property')
      ) {
        missingFields.push('Algorithm');
      }
      if (mainFormErrors.model?.__errors?.includes('is a required property')) {
        missingFields.push('Model');
      }
      if (
        mainFormErrors.testDataset?.__errors?.includes('is a required property')
      ) {
        missingFields.push('Test Dataset');
      }
      if (
        mainFormErrors.groundTruth?.__errors?.includes(
          'is a required property'
        ) &&
        formData.groundTruthDataset
      ) {
        missingFields.push('Ground Truth Column');
      }
    }

    // Check algorithm form errors if algorithm is selected
    if (selectedAlgorithm && algorithmFormErrors) {
      // Get the algorithm schema to check which fields are required
      const algoSchema = algorithmParamsSchema;
      const requiredFields = (algoSchema.required || []) as string[];

      // Check each required field
      requiredFields.forEach((field) => {
        const fieldName = String(field);
        if (
          algorithmFormErrors[fieldName]?.__errors?.includes(
            'is a required property'
          )
        ) {
          // Get a more friendly name from the schema if available
          const propSchema = algoSchema.properties?.[fieldName];

          // Safely get the title property
          let friendlyName = fieldName;
          if (
            propSchema &&
            typeof propSchema === 'object' &&
            propSchema !== null
          ) {
            // Use a type assertion to access the potential title property
            const schemaObj = propSchema as { title?: string };
            if (schemaObj.title) {
              friendlyName = schemaObj.title;
            }
          }

          missingFields.push(`${friendlyName} (Algorithm Parameter)`);
        }
      });
    }

    if (missingFields.length === 0) {
      return '';
    } else if (missingFields.length === 1) {
      return `Please fill in the required field: ${missingFields[0]}`;
    } else {
      const lastField = missingFields.pop();
      return `Please fill in the required fields: ${missingFields.join(', ')} and ${lastField}`;
    }
  };

  // Determine if the form is valid overall
  const isFormValid = isMainFormValid && isAlgorithmFormValid && isServerActive;

  // Get message about missing fields
  const missingFieldsMessage = getMissingFieldsMessage();

  if (!isServerActive) {
    return (
      <>
        <ServerStatusModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
        <div className="flex flex-col items-center justify-center py-8">
          <p className="mb-4 text-yellow-600">
            The Test Engine Worker is not running. You cannot run tests until it
            is activated.
          </p>
          <Button
            variant={ButtonVariant.PRIMARY}
            text="Show Instructions"
            size="md"
            onClick={() => setShowModal(true)}
          />
        </div>
      </>
    );
  }

  return (
    <div className="rounded-lg bg-[var(--color-secondary-950)] p-6 text-white shadow">
      <div className="custom-form-container">
        <h3 className="mb-4 text-xl font-semibold">
          Configure Test Parameters
        </h3>
        <Form
          schema={selectionSchema}
          validator={validator}
          formData={formData}
          onChange={handleFormChange}
          // onSubmit={handleSubmit as unknown as FormProps['onSubmit']}
          uiSchema={uiSchema}
          widgets={widgets}
          className="custom-form"
          liveValidate={true}
          showErrorList={false}
          key={`selection-form-${plugins.length}-${allAlgorithms.length}`}
          templates={{
            FieldTemplate: customFieldTemplate,
            ArrayFieldTemplate: customArrayFieldTemplate,
          }}
        />
      </div>

      {selectedAlgorithm && hasAlgorithmParameters && (
        <div className="mt-6">
          <h3 className="mb-4 text-lg font-medium">Algorithm Parameters</h3>
          <div className="custom-form-container">
            <Form
              schema={algorithmParamsSchema}
              validator={validator}
              formData={algorithmArgs}
              // onChange={(e) => setAlgorithmArgs(e.formData)}
              onChange={handleAlgorithmParamChange}
              uiSchema={algorithmUISchema}
              widgets={widgets}
              className="custom-form"
              liveValidate={true}
              showErrorList={false}
              key={`algorithm-form-${selectedAlgorithm}`}
              templates={{
                FieldTemplate: customFieldTemplate,
                ArrayFieldTemplate: customArrayFieldTemplate,
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded border border-yellow-700 bg-yellow-50 p-4 dark:bg-yellow-900/30">
          <div className="flex items-start">
            <Icon
              name={IconName.Alert}
              size={20}
              color="#fcc800"
              style={{ marginRight: '0.75rem', marginTop: '0.125rem' }}
            />
            <div>
              <h4 className="mb-1 font-medium text-yellow-800 dark:text-yellow-200">
                Error Running Test
              </h4>
              <p className="text-yellow-800 dark:text-yellow-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col space-y-2">
        <div className="flex justify-end space-x-3">
          <Button
            variant={ButtonVariant.OUTLINE}
            text="Cancel"
            size="md"
            textColor="white"
            onClick={() => router.push('/results')}
          />
          <Button
            variant={ButtonVariant.PRIMARY}
            text={isPending ? 'Running...' : 'Run Test'}
            size="md"
            disabled={isPending || !isFormValid}
            onClick={() => handleSubmit()}
          />
        </div>

        {!isFormValid && !isPending && missingFieldsMessage && (
          <div className="flex items-center justify-end text-sm text-yellow-500">
            <Icon
              name={IconName.Alert}
              size={16}
              color="#fcc800"
              style={{ marginRight: '0.5rem' }}
            />
            <span>{missingFieldsMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
