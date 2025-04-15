'use client';

import Form from '@rjsf/core';
import {
  RJSFSchema,
  UiSchema,
  FieldTemplateProps,
  ArrayFieldTemplateProps,
  ArrayFieldTemplateItemType,
  WidgetProps,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import useSubmitTest from '@/app/results/run/hooks/useSubmitTest';
import { Algorithm, Plugin } from '@/app/types';
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
  const enumOptions = (options.enumOptions || []) as SelectOption[];
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
  console.log(value, selectedOption);
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

interface TestRunFormProps {
  plugins: Plugin[];
  models: Array<{ filename: string; name: string }>;
  datasets: Array<{ filename: string; name: string }>;
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
  algorithmArgs?: Record<string, unknown>;
}

// Add a helper function to determine if a field is a text input

// Function to check if formData change is for a text input

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
    algorithmArgs: {},
  });
  const [error, setError] = useState<string | null>(null);
  const [isServerActive] = useState<boolean>(initialServerActive);
  const [showModal, setShowModal] = useState(!initialServerActive);

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
    } else {
      setSelectedAlgorithm(null);
    }
  }, [formData.algorithm]);

  // Debounced form change handler
  const handleFormChange = (e: IChangeEvent) => {
    const newFormData = e.formData as FormState;

    // Check if this is a dropdown or text field
    const isDropdown =
      newFormData &&
      (formData.algorithm !== newFormData.algorithm ||
        formData.model !== newFormData.model ||
        formData.testDataset !== newFormData.testDataset ||
        formData.groundTruthDataset !== newFormData.groundTruthDataset);

    // For dropdowns, update immediately
    if (isDropdown) {
      setFormData(newFormData);
      return;
    }

    // For text fields, debounce updates
    if (mainFormTimer.current) {
      clearTimeout(mainFormTimer.current);
    }

    mainFormTimer.current = setTimeout(() => {
      setFormData(newFormData);
    }, 500);
  };

  // Debounced algorithm param change handler
  const handleAlgorithmParamChange = (e: IChangeEvent) => {
    if (algorithmFormTimer.current) {
      clearTimeout(algorithmFormTimer.current);
    }

    // For algorithm parameters, use debouncing
    algorithmFormTimer.current = setTimeout(() => {
      const algorithmArgs = e.formData as Record<string, unknown>;
      if (algorithmArgs) {
        setFormData((prev) => ({
          ...prev,
          algorithmArgs,
        }));
      }
    }, 500);
  };

  // Schema for test selection (plugin, algorithm, model, dataset)
  const selectionSchema: RJSFSchema = {
    type: 'object',
    required: ['algorithm', 'model', 'testDataset'],
    properties: {
      algorithm: {
        type: 'string',
        title: 'Algorithm',
        enum: allAlgorithms.map((algo) => algo.cid),
      },
      model: {
        type: 'string',
        title: 'Model',
        enum: models.map((model) => model.filename),
      },
      testDataset: {
        type: 'string',
        title: 'Test Dataset',
        enum: datasets.map((dataset) => dataset.filename),
      },
      groundTruthDataset: {
        type: 'string',
        title: 'Ground Truth Dataset (Optional)',
        enum: datasets.map((dataset) => dataset.filename),
      },
      groundTruth: {
        type: 'string',
        title:
          'Ground Truth Column (Required if Ground Truth Dataset is selected)',
        description:
          'The column name in the dataset that contains the ground truth values',
      },
    },
  };

  // UI Schema for form display - configure custom widgets
  const uiSchema: UiSchema = {
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
        label: algo.zip_hash,
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
      'ui:widget': 'CustomTextWidget',
    },
  };

  // Create a map of custom widgets
  const widgets = {
    CustomTextWidget: CustomTextWidget,
    CustomSelectWidget: CustomSelectWidget,
  };

  // Get algorithm input schema
  const getAlgorithmParamsSchema = (): RJSFSchema => {
    if (!selectedAlgorithm) return { type: 'object', properties: {} };

    const algo = allAlgorithms.find((a) => a.cid === selectedAlgorithm);
    if (!algo) return { type: 'object', properties: {} };

    return algo.inputSchema as RJSFSchema;
  };

  // Get algorithm UI schema
  const getAlgorithmUISchema = (): UiSchema => {
    // Create a UI schema that applies CustomTextWidget to all string inputs without enum
    const schema = getAlgorithmParamsSchema();
    if (!schema.properties) return {};

    const uiSchema: UiSchema = {};

    // For each property that is a string type without enum, use our custom widget
    Object.keys(schema.properties).forEach((propName) => {
      const prop = schema.properties![propName] as RJSFSchema;
      if (prop.type === 'string') {
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
    });

    return uiSchema;
  };

  // Check if algorithm has parameters
  const hasAlgorithmParameters = (): boolean => {
    const schema = getAlgorithmParamsSchema();
    return !!(
      schema &&
      schema.properties &&
      Object.keys(schema.properties).length > 0
    );
  };

  // Handle form submission
  const handleSubmit = async ({
    formData: submitData,
  }: {
    formData: FormState;
  }) => {
    try {
      setError(null);

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

      // Prepare input data
      const inputData: TestRunInput = {
        mode: 'upload',
        algorithmGID: selectedAlgo.pluginGid,
        algorithmCID: submitData.algorithm,
        algorithmArgs: submitData.algorithmArgs || {},
        modelFilename: submitData.model || '',
        testDatasetFilename: submitData.testDataset || '',
        groundTruthDatasetFilename: submitData.groundTruthDataset,
        groundTruth: submitData.groundTruth || 'default',
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

  // Custom field templates to handle specific fields
  const customFieldTemplate = (props: FieldTemplateProps) => {
    const { id, label, required, children, rawErrors, schema, uiSchema } =
      props;

    // Don't render labels for array items as they'll get their own labels
    const isArrayItem =
      id.includes('_') &&
      id.split('_').length > 2 &&
      !isNaN(Number(id.split('_').pop()));

    // Skip rendering labels for array fields since they're handled by ArrayFieldTemplate
    const isArray = schema.type === 'array';

    // Skip rendering labels for array items or nested objects
    if (isArrayItem || isArray) {
      return <div className="w-full">{children}</div>;
    }

    // Default rendering for all other fields
    return (
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

        {rawErrors && rawErrors.length > 0 && (
          <div className="mt-1 text-sm text-[var(--color-danger)]">
            {rawErrors.map((error: string, i: number) => (
              <div key={i}>{error}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Custom array field template
  const customArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
    return (
      <div className="array-field-container">
        {props.canAdd && (
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
        )}
        {props.items.map((element: ArrayFieldTemplateItemType) => (
          <div
            key={element.key}
            className="array-item">
            <div className="flex-grow">{element.children}</div>
            {element.hasRemove && (
              <button
                type="button"
                className="ml-2 rounded bg-[var(--color-danger)] px-2 py-1 text-white"
                onClick={element.onDropIndexClick(element.index)}>
                ✕
              </button>
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
          onSubmit={handleSubmit as unknown as FormProps['onSubmit']}
          uiSchema={uiSchema}
          widgets={widgets}
          className="custom-form"
          liveValidate={false}
          showErrorList={false}
          key={`selection-form-${plugins.length}-${allAlgorithms.length}`}
          templates={{
            FieldTemplate: customFieldTemplate,
            ArrayFieldTemplate: customArrayFieldTemplate,
          }}
        />
      </div>

      {selectedAlgorithm && hasAlgorithmParameters() && (
        <div className="mt-6">
          <h3 className="mb-4 text-lg font-medium">Algorithm Parameters</h3>
          <div className="custom-form-container">
            <Form
              schema={getAlgorithmParamsSchema()}
              validator={validator}
              formData={formData.algorithmArgs || {}}
              onChange={handleAlgorithmParamChange}
              uiSchema={getAlgorithmUISchema()}
              widgets={widgets}
              className="custom-form"
              liveValidate={false}
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

      <div className="mt-6 flex justify-end space-x-3">
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
          disabled={isPending}
          onClick={() => handleSubmit({ formData })}
        />
      </div>
    </div>
  );
}
