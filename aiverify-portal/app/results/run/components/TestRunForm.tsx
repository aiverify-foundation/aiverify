'use client';

import Form from '@rjsf/core';
import {
  RJSFSchema,
  UiSchema,
  WidgetProps,
  FieldTemplateProps,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import useSubmitTest from '@/app/results/run/hooks/useSubmitTest';
import { Algorithm, Plugin } from '@/app/types';
import { Button, ButtonVariant } from '@/lib/components/button';
import { TestRunInput } from '@/lib/fetchApis/getTestRunApis';
import ServerStatusModal from './ServerStatusModal';
import type { FormProps } from '@rjsf/core';
import './form-styles.css';

interface TestRunFormProps {
  plugins: Plugin[];
  models: Array<{ filename: string; name: string }>;
  datasets: Array<{ filename: string; name: string }>;
  initialServerActive: boolean;
}

interface FormState {
  plugin?: string;
  algorithm?: string;
  model?: string;
  testDataset?: string;
  groundTruthDataset?: string;
  groundTruth?: string;
  algorithmArgs?: Record<string, unknown>;
}

export default function TestRunForm({
  plugins,
  models,
  datasets,
  initialServerActive,
}: TestRunFormProps) {
  const router = useRouter();
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(
    null
  );
  const [availableAlgorithms, setAvailableAlgorithms] = useState<Algorithm[]>(
    []
  );
  const [formData, setFormData] = useState<FormState>({
    algorithmArgs: {},
  });
  const [error, setError] = useState<string | null>(null);
  const [isServerActive, setIsServerActive] =
    useState<boolean>(initialServerActive);
  const [showModal, setShowModal] = useState(!initialServerActive);

  // Initialize the submit test mutation
  const {
    mutate: submitTest,
    isPending,
    error: submissionError,
  } = useSubmitTest({
    onSuccess: (data) => {
      console.log('Test submitted successfully:', data);
      // Redirect to the active tests page to see the running test
      router.push('/results/run/view_tests');
    },
    onError: (err: Error) => {
      console.error('Error submitting test:', err);
      setError(err.message);
    },
  });

  // Custom plugin select widget
  const PluginSelectWidget = ({
    options,
    value,
    onChange,
    id,
    placeholder,
  }: WidgetProps) => {
    return (
      <div className="mb-2">
        <select
          id={id}
          className="w-full rounded-md border border-[var(--color-secondary-700)] bg-[var(--color-secondary-800)] p-2 text-white"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}>
          <option value="">{placeholder || '-- Select a Plugin --'}</option>
          {options.enumOptions &&
            options.enumOptions.map((option) => (
              <option
                key={`${option.value}`}
                value={`${option.value}`}>
                {option.label}
              </option>
            ))}
        </select>
        <p className="mt-1 text-sm text-[var(--color-primary-300)]">
          Select a plugin to see available algorithms
        </p>
      </div>
    );
  };

  // Custom widgets mapping
  const widgets = {
    pluginSelect: PluginSelectWidget,
  };

  // Log for debugging
  useEffect(() => {
    console.log('Plugins available:', plugins);
  }, [plugins]);

  // Update available algorithms when plugin selection changes
  useEffect(() => {
    if (formData.plugin) {
      const plugin = plugins.find((p) => p.gid === formData.plugin);
      if (plugin) {
        console.log('Selected plugin:', plugin.name);
        setSelectedPlugin(plugin.gid);
        setAvailableAlgorithms(plugin.algorithms);
        // Reset algorithm selection when plugin changes
        setFormData((prev) => ({
          ...prev,
          algorithm: undefined,
          algorithmArgs: {},
        }));
        setSelectedAlgorithm(null);
      }
    } else {
      setAvailableAlgorithms([]);
      setSelectedPlugin(null);
      setSelectedAlgorithm(null);
    }
  }, [formData.plugin, plugins]);

  // Update selected algorithm when algorithm selection changes
  useEffect(() => {
    if (formData.algorithm) {
      setSelectedAlgorithm(formData.algorithm);
    } else {
      setSelectedAlgorithm(null);
    }
  }, [formData.algorithm]);

  // Set groundTruthDataset to testDataset when not explicitly chosen
  useEffect(() => {
    if (
      formData.testDataset &&
      (!formData.groundTruthDataset || formData.groundTruthDataset === '')
    ) {
      setFormData((prev) => ({
        ...prev,
        groundTruthDataset: formData.testDataset,
      }));
    }
  }, [formData.testDataset]);

  // Schema for test selection (plugin, algorithm, model, dataset)
  const selectionSchema: RJSFSchema = {
    type: 'object',
    required: ['plugin', 'algorithm', 'model', 'testDataset'],
    properties: {
      plugin: {
        type: 'string',
        title: 'Plugin',
        enum: plugins.map((plugin) => plugin.gid),
      },
      algorithm: {
        type: 'string',
        title: 'Algorithm',
        enum: availableAlgorithms.map((algo) => algo.cid),
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
        enum: ['', ...datasets.map((dataset) => dataset.filename)],
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

  // UI Schema for form display
  const uiSchema: UiSchema = {
    'ui:order': [
      'plugin',
      'algorithm',
      'model',
      'testDataset',
      'groundTruthDataset',
      'groundTruth',
      '*',
    ],
    plugin: {
      'ui:placeholder': '-- Select a Plugin --',
      'ui:emptyValue': '',
      'ui:widget': 'pluginSelect',
      'ui:enumOptions': plugins.map((plugin) => ({
        label: plugin.name,
        value: plugin.gid,
      })),
    },
    algorithm: {
      'ui:placeholder': '-- Select an Algorithm --',
      'ui:emptyValue': '',
      'ui:enumOptions': availableAlgorithms.map((algo) => ({
        label: algo.name,
        value: algo.cid,
      })),
    },
    model: {
      'ui:placeholder': '-- Select a Model --',
      'ui:emptyValue': '',
      'ui:enumOptions': models.map((model) => ({
        label: model.name,
        value: model.filename,
      })),
    },
    testDataset: {
      'ui:placeholder': '-- Select a Test Dataset --',
      'ui:emptyValue': '',
      'ui:enumOptions': datasets.map((dataset) => ({
        label: dataset.name,
        value: dataset.filename,
      })),
    },
    groundTruthDataset: {
      'ui:placeholder': '-- Select a Ground Truth Dataset --',
      'ui:emptyValue': '',
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
      'ui:emptyValue': 'default',
    },
  };

  // Get algorithm input schema
  const getAlgorithmParamsSchema = (): RJSFSchema => {
    if (!selectedPlugin || !selectedAlgorithm)
      return { type: 'object', properties: {} };

    const plugin = plugins.find((p) => p.gid === selectedPlugin);
    if (!plugin) return { type: 'object', properties: {} };

    const algo = plugin.algorithms.find((a) => a.cid === selectedAlgorithm);
    if (!algo) return { type: 'object', properties: {} };

    return algo.inputSchema as RJSFSchema;
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

      if (!submitData.plugin || !submitData.algorithm) {
        throw new Error('Please select a plugin and algorithm');
      }

      // If groundTruthDataset is empty, use testDataset
      if (!submitData.groundTruthDataset) {
        submitData.groundTruthDataset = submitData.testDataset;
      }

      // Prepare input data
      const inputData: TestRunInput = {
        mode: 'upload',
        algorithmGID: submitData.plugin,
        algorithmCID: submitData.algorithm,
        algorithmArgs: submitData.algorithmArgs || {},
        modelFilename: submitData.model || '',
        testDatasetFilename: submitData.testDataset || '',
        groundTruthDatasetFilename: submitData.groundTruthDataset || undefined,
        groundTruth: submitData.groundTruth || undefined,
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

  // Custom field templates to handle specific fields
  const customFieldTemplate = (props: FieldTemplateProps) => {
    const { id, label, required, children, rawErrors, schema } = props;

    // Special handling for plugin field
    if (id === 'root_plugin') {
      const pluginOptions = plugins.map((plugin) => ({
        value: plugin.gid,
        label: plugin.name,
      }));

      return (
        <div className="mb-4">
          <label className="mb-2 block font-medium text-white">
            {label || 'Plugin'}
            {required && (
              <span className="ml-1 text-[var(--color-danger)]">*</span>
            )}
          </label>
          <select
            id={id}
            className="w-full rounded-md border border-[var(--color-secondary-700)] bg-[var(--color-secondary-800)] p-2 text-white"
            value={formData.plugin || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              setFormData({
                ...formData,
                plugin: newValue,
                algorithm: undefined,
                algorithmArgs: {},
              });
            }}>
            <option value="">-- Select a Plugin --</option>
            {pluginOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-[var(--color-primary-300)]">
            Select a plugin to see available algorithms
          </p>
          {rawErrors && rawErrors.length > 0 && (
            <div className="mt-1 text-sm text-[var(--color-danger)]">
              {rawErrors.map((error: string, i: number) => (
                <div key={i}>{error}</div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Default rendering for all other fields
    return (
      <div className="mb-4">
        <label className="mb-2 block font-medium text-white">
          {schema.title || label}
          {required && (
            <span className="ml-1 text-[var(--color-danger)]">*</span>
          )}
        </label>
        {children}
        {schema.description && (
          <p className="mt-1 text-sm text-[var(--color-primary-300)]">
            {schema.description}
          </p>
        )}
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

  if (!isServerActive) {
    return (
      <>
        <ServerStatusModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
        <div className="py-8 text-center">
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

        {/* Debug info - remove in production */}
        <div className="mb-4 text-xs opacity-70">
          {plugins.length} plugins available
        </div>

        <Form
          schema={selectionSchema}
          validator={validator}
          formData={formData}
          onChange={({ formData }) => setFormData(formData as FormState)}
          onSubmit={handleSubmit as unknown as FormProps['onSubmit']}
          uiSchema={uiSchema}
          className="custom-form"
          liveValidate={false}
          showErrorList={false}
          key={`selection-form-${plugins.length}-${availableAlgorithms.length}`}
          widgets={widgets}
          templates={{ FieldTemplate: customFieldTemplate }}
        />
      </div>

      {selectedAlgorithm && (
        <div className="mt-6">
          <h3 className="mb-4 text-lg font-medium">Algorithm Parameters</h3>
          <div className="custom-form-container">
            <Form
              schema={getAlgorithmParamsSchema()}
              validator={validator}
              formData={formData.algorithmArgs || {}}
              onChange={({ formData: algorithmArgs }) =>
                setFormData((prev) => ({
                  ...prev,
                  algorithmArgs: algorithmArgs as Record<string, unknown>,
                }))
              }
              className="custom-form"
              liveValidate={false}
              showErrorList={false}
              key={`algorithm-form-${selectedAlgorithm}`}
              templates={{ FieldTemplate: customFieldTemplate }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded border border-red-300 bg-[var(--color-danger)] bg-opacity-20 p-3 text-white">
          {error}
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
