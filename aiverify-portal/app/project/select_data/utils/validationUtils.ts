import React from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';

// Types
export interface ValidationResult {
  isValid: boolean;
  message: string;
  progress: number;
  id?: number;
}

export interface ValidationResults {
  [key: string]: ValidationResult;
}

// Function to extract validation functions from MDX bundle code
export const extractValidationFunctions = (code: string) => {
  try {
    const context = {
      React,
      jsx: ReactJSXRuntime.jsx,
      jsxs: ReactJSXRuntime.jsxs,
      _jsx_runtime: ReactJSXRuntime,
      Fragment: ReactJSXRuntime.Fragment,
    };

    const moduleFactory = new Function(...Object.keys(context), code);
    const moduleExports = moduleFactory(...Object.values(context));

    return {
      validate: moduleExports.validate,
      progress: moduleExports.progress,
      summary: moduleExports.summary,
    };
  } catch (error) {
    console.error('Error extracting validation functions:', error);
    return null;
  }
};

// Function to validate input block data
export const validateInputBlock = async (
  gid: string,
  cid: string,
  data: Record<string, unknown>,
  id?: number
): Promise<ValidationResult> => {
  try {
    // console.log('>>> validateInputBlock:', gid, cid, id, data);
    const response = await fetch(`/api/plugins/${gid}/summary/${cid}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch summary bundle: ${response.status}`);
    }

    const mdxSummaryBundle = await response.json();
    if (!mdxSummaryBundle?.code) {
      throw new Error('No code in MDX bundle');
    }

    const validationFunctions = extractValidationFunctions(
      mdxSummaryBundle.code
    );
    if (!validationFunctions) {
      throw new Error('Failed to extract validation functions');
    }

    let isValid = false;
    let progress = 0;
    let message = 'Not validated';

    if (validationFunctions.validate) {
      isValid = validationFunctions.validate(data);
    }

    if (validationFunctions.progress) {
      progress = validationFunctions.progress(data);
    }

    if (validationFunctions.summary) {
      message = validationFunctions.summary(data);
    }

    return { isValid, message, progress, id };
  } catch (error) {
    console.error('Validation error:', error);
    return { isValid: false, message: 'Validation error', progress: 0, id };
  }
};

// Helper function to create consistent validation keys
export const createValidationKey = (
  gid: string,
  cid: string,
  id?: number
): string => {
  return id !== undefined ? `${gid}-${cid}-${id}` : `${gid}-${cid}`;
};

// Function to process batch validations
export const processBatchValidations = async (
  inputs: Array<{
    gid: string;
    cid: string;
    data: Record<string, unknown>;
    id?: number;
  }>,
  batchSize = 5,
  delayBetweenBatches = 300
): Promise<ValidationResults> => {
  const results: ValidationResults = {};

  const processBatch = async (startIndex: number): Promise<void> => {
    if (startIndex >= inputs.length) return;

    const endIndex = Math.min(startIndex + batchSize, inputs.length);
    const currentBatch = inputs.slice(startIndex, endIndex);

    await Promise.all(
      currentBatch.map(async (input) => {
        const key = createValidationKey(input.gid, input.cid, input.id);
        results[key] = await validateInputBlock(
          input.gid,
          input.cid,
          input.data,
          input.id
        );
      })
    );

    await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    await processBatch(endIndex);
  };

  await processBatch(0);
  return results;
};
