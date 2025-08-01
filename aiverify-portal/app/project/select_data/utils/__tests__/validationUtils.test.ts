import React from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import {
  extractValidationFunctions,
  validateInputBlock,
  createValidationKey,
  processBatchValidations,
  ValidationResult,
  ValidationResults,
} from '../validationUtils';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('validationUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('extractValidationFunctions', () => {
    it('should successfully extract validation functions from valid code', () => {
      const mockCode = `
        return {
          validate: (data) => data.isValid || false,
          progress: (data) => data.progress || 0,
          summary: (data) => data.message || 'Default message'
        };
      `;

      const result = extractValidationFunctions(mockCode);

      expect(result).toBeDefined();
      expect(result?.validate).toBeDefined();
      expect(result?.progress).toBeDefined();
      expect(result?.summary).toBeDefined();
      expect(typeof result?.validate).toBe('function');
      expect(typeof result?.progress).toBe('function');
      expect(typeof result?.summary).toBe('function');
    });

    it('should handle code with missing functions', () => {
      const mockCode = `
        return {
          validate: (data) => data.isValid || false
        };
      `;

      const result = extractValidationFunctions(mockCode);

      expect(result).toBeDefined();
      expect(result?.validate).toBeDefined();
      expect(result?.progress).toBeUndefined();
      expect(result?.summary).toBeUndefined();
    });

    it('should return null when code execution fails', () => {
      const invalidCode = `
        throw new Error('Test error');
      `;

      const result = extractValidationFunctions(invalidCode);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error extracting validation functions:',
        expect.any(Error)
      );
    });

    it('should return null when code is syntactically invalid', () => {
      const invalidCode = `
        return {
          validate: (data) => {
            invalid syntax here
          }
        };
      `;

      const result = extractValidationFunctions(invalidCode);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error extracting validation functions:',
        expect.any(Error)
      );
    });

    it('should provide correct context to the module factory', () => {
      const mockCode = `
        return {
          validate: (data) => {
            return React && jsx && jsxs && _jsx_runtime && Fragment ? true : false;
          }
        };
      `;

      const result = extractValidationFunctions(mockCode);

      expect(result).toBeDefined();
      expect(result?.validate({})).toBe(true);
    });

    it('should handle code that returns undefined', () => {
      const mockCode = `
        return undefined;
      `;

      const result = extractValidationFunctions(mockCode);

      expect(result).toBeNull();
    });

    it('should handle code that returns null', () => {
      const mockCode = `
        return null;
      `;

      const result = extractValidationFunctions(mockCode);

      expect(result).toBeNull();
    });
  });

  describe('validateInputBlock', () => {
    it('should successfully validate input block with all functions', async () => {
      const mockMdxBundle = {
        code: `
          return {
            validate: (data) => data.isValid || false,
            progress: (data) => data.progress || 0,
            summary: (data) => data.message || 'Default message'
          };
        `,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMdxBundle,
      });

      const result = await validateInputBlock('test-gid', 'test-cid', {
        isValid: true,
        progress: 75,
        message: 'Test message',
      });

      expect(fetch).toHaveBeenCalledWith('/api/plugins/test-gid/summary/test-cid');
      expect(result).toEqual({
        isValid: true,
        progress: 75,
        message: 'Test message',
        id: undefined,
      });
    });

    it('should handle validation with id parameter', async () => {
      const mockMdxBundle = {
        code: `
          return {
            validate: (data) => data.isValid || false,
            progress: (data) => data.progress || 0,
            summary: (data) => data.message || 'Default message'
          };
        `,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMdxBundle,
      });

      const result = await validateInputBlock('test-gid', 'test-cid', {
        isValid: true,
        progress: 50,
        message: 'Test message',
      }, 123);

      expect(result).toEqual({
        isValid: true,
        progress: 50,
        message: 'Test message',
        id: 123,
      });
    });

    it('should handle missing validation functions gracefully', async () => {
      const mockMdxBundle = {
        code: `
          return {
            // No validation functions
          };
        `,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMdxBundle,
      });

      const result = await validateInputBlock('test-gid', 'test-cid', {});

      expect(result).toEqual({
        isValid: false,
        progress: 0,
        message: 'Not validated',
        id: undefined,
      });
    });

    it('should handle fetch error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await validateInputBlock('test-gid', 'test-cid', {});

      expect(result).toEqual({
        isValid: false,
        message: 'Validation error',
        progress: 0,
        id: undefined,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Validation error:',
        expect.any(Error)
      );
    });

    it('should handle missing code in MDX bundle', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await validateInputBlock('test-gid', 'test-cid', {});

      expect(result).toEqual({
        isValid: false,
        message: 'Validation error',
        progress: 0,
        id: undefined,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Validation error:',
        expect.any(Error)
      );
    });

    it('should handle failed validation function extraction', async () => {
      const mockMdxBundle = {
        code: `
          return {
            validate: (data) => {
              throw new Error('Validation function error');
            }
          };
        `,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMdxBundle,
      });

      const result = await validateInputBlock('test-gid', 'test-cid', {});

      expect(result).toEqual({
        isValid: false,
        message: 'Validation error',
        progress: 0,
        id: undefined,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Validation error:',
        expect.any(Error)
      );
    });

    it('should handle network error during fetch', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await validateInputBlock('test-gid', 'test-cid', {});

      expect(result).toEqual({
        isValid: false,
        message: 'Validation error',
        progress: 0,
        id: undefined,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Validation error:',
        expect.any(Error)
      );
    });

    it('should handle null MDX bundle response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const result = await validateInputBlock('test-gid', 'test-cid', {});

      expect(result).toEqual({
        isValid: false,
        message: 'Validation error',
        progress: 0,
        id: undefined,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Validation error:',
        expect.any(Error)
      );
    });

    it('should handle case where extractValidationFunctions returns null', async () => {
      const mockMdxBundle = {
        code: `
          throw new Error('Function extraction error');
        `,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMdxBundle,
      });

      const result = await validateInputBlock('test-gid', 'test-cid', {});

      expect(result).toEqual({
        isValid: false,
        message: 'Validation error',
        progress: 0,
        id: undefined,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Validation error:',
        expect.any(Error)
      );
    });
  });

  describe('createValidationKey', () => {
    it('should create validation key without id', () => {
      const key = createValidationKey('test-gid', 'test-cid');
      expect(key).toBe('test-gid-test-cid');
    });

    it('should create validation key with id', () => {
      const key = createValidationKey('test-gid', 'test-cid', 123);
      expect(key).toBe('test-gid-test-cid-123');
    });

    it('should handle id as 0', () => {
      const key = createValidationKey('test-gid', 'test-cid', 0);
      expect(key).toBe('test-gid-test-cid-0');
    });

    it('should handle special characters in gid and cid', () => {
      const key = createValidationKey('test-gid@123', 'test-cid#456', 789);
      expect(key).toBe('test-gid@123-test-cid#456-789');
    });
  });

  describe('processBatchValidations', () => {
    it('should process batch validations successfully', async () => {
      const mockMdxBundle = {
        code: `
          return {
            validate: (data) => data.isValid || false,
            progress: (data) => data.progress || 0,
            summary: (data) => data.message || 'Default message'
          };
        `,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMdxBundle,
      });

      const inputs = [
        {
          gid: 'gid1',
          cid: 'cid1',
          data: { isValid: true, progress: 50, message: 'Test 1' },
          id: 1,
        },
        {
          gid: 'gid2',
          cid: 'cid2',
          data: { isValid: false, progress: 25, message: 'Test 2' },
          id: 2,
        },
      ];

      const results = await processBatchValidations(inputs, 2, 100);

      expect(Object.keys(results)).toHaveLength(2);
      expect(results['gid1-cid1-1']).toEqual({
        isValid: true,
        progress: 50,
        message: 'Test 1',
        id: 1,
      });
      expect(results['gid2-cid2-2']).toEqual({
        isValid: false,
        progress: 25,
        message: 'Test 2',
        id: 2,
      });
      expect(fetch).toHaveBeenCalledTimes(2);
    }, 15000);

    it('should handle empty inputs array', async () => {
      const results = await processBatchValidations([], 5, 300);

      expect(results).toEqual({});
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle single input', async () => {
      const mockMdxBundle = {
        code: `
          return {
            validate: (data) => data.isValid || false,
            progress: (data) => data.progress || 0,
            summary: (data) => data.message || 'Default message'
          };
        `,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMdxBundle,
      });

      const inputs = [
        {
          gid: 'gid1',
          cid: 'cid1',
          data: { isValid: true, progress: 100, message: 'Single test' },
        },
      ];

      const results = await processBatchValidations(inputs, 5, 300);

      expect(Object.keys(results)).toHaveLength(1);
      expect(results['gid1-cid1']).toEqual({
        isValid: true,
        progress: 100,
        message: 'Single test',
        id: undefined,
      });
    }, 15000);

    it('should handle validation errors in batch', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const inputs = [
        {
          gid: 'gid1',
          cid: 'cid1',
          data: { isValid: true, progress: 50, message: 'Test 1' },
          id: 1,
        },
        {
          gid: 'gid2',
          cid: 'cid2',
          data: { isValid: false, progress: 25, message: 'Test 2' },
          id: 2,
        },
      ];

      const results = await processBatchValidations(inputs, 2, 100);

      expect(Object.keys(results)).toHaveLength(2);
      expect(results['gid1-cid1-1']).toEqual({
        isValid: false,
        message: 'Validation error',
        progress: 0,
        id: 1,
      });
      expect(results['gid2-cid2-2']).toEqual({
        isValid: false,
        message: 'Validation error',
        progress: 0,
        id: 2,
      });
    }, 15000);

    it('should respect batch size limits', async () => {
      const mockMdxBundle = {
        code: `
          return {
            validate: (data) => data.isValid || false,
            progress: (data) => data.progress || 0,
            summary: (data) => data.message || 'Default message'
          };
        `,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMdxBundle,
      });

      const inputs = Array.from({ length: 10 }, (_, i) => ({
        gid: `gid${i}`,
        cid: `cid${i}`,
        data: { isValid: true, progress: i * 10, message: `Test ${i}` },
        id: i,
      }));

      const results = await processBatchValidations(inputs, 3, 100);

      expect(Object.keys(results)).toHaveLength(10);
      expect(fetch).toHaveBeenCalledTimes(10);
    }, 15000);

    it('should handle custom batch size and delay', async () => {
      const mockMdxBundle = {
        code: `
          return {
            validate: (data) => data.isValid || false,
            progress: (data) => data.progress || 0,
            summary: (data) => data.message || 'Default message'
          };
        `,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMdxBundle,
      });

      const inputs = [
        {
          gid: 'gid1',
          cid: 'cid1',
          data: { isValid: true, progress: 50, message: 'Test 1' },
        },
        {
          gid: 'gid2',
          cid: 'cid2',
          data: { isValid: false, progress: 25, message: 'Test 2' },
        },
      ];

      const results = await processBatchValidations(inputs, 1, 500);

      expect(Object.keys(results)).toHaveLength(2);
      expect(fetch).toHaveBeenCalledTimes(2);
    }, 15000);

    it('should handle large batch with default parameters', async () => {
      const mockMdxBundle = {
        code: `
          return {
            validate: (data) => data.isValid || false,
            progress: (data) => data.progress || 0,
            summary: (data) => data.message || 'Default message'
          };
        `,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMdxBundle,
      });

      const inputs = Array.from({ length: 15 }, (_, i) => ({
        gid: `gid${i}`,
        cid: `cid${i}`,
        data: { isValid: i % 2 === 0, progress: i * 5, message: `Test ${i}` },
        id: i,
      }));

      const results = await processBatchValidations(inputs);

      expect(Object.keys(results)).toHaveLength(15);
      expect(fetch).toHaveBeenCalledTimes(15);
    }, 15000);
  });

  describe('Integration tests', () => {
    it('should handle complex validation scenarios', async () => {
      const mockMdxBundle = {
        code: `
          return {
            validate: (data) => {
              return data.required && data.required.length > 0 && data.optional !== undefined;
            },
            progress: (data) => {
              let progress = 0;
              if (data.required) progress += 50;
              if (data.required && data.required.length > 0) progress += 30;
              if (data.optional !== undefined) progress += 20;
              return progress;
            },
            summary: (data) => {
              if (!data.required) return 'Required field is missing';
              if (data.required.length === 0) return 'Required field is empty';
              if (data.optional === undefined) return 'Optional field is missing';
              return 'All validations passed';
            }
          };
        `,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMdxBundle,
      });

      const result = await validateInputBlock('complex-gid', 'complex-cid', {
        required: 'test value',
        optional: 'optional value',
      });

      expect(result).toEqual({
        isValid: true,
        progress: 100,
        message: 'All validations passed',
        id: undefined,
      });
    });

    it('should handle validation with React context', async () => {
      const mockMdxBundle = {
        code: `
          return {
            validate: (data) => {
              // Test that React context is available
              return typeof React !== 'undefined' && 
                     typeof jsx !== 'undefined' && 
                     typeof jsxs !== 'undefined' &&
                     typeof _jsx_runtime !== 'undefined' &&
                     typeof Fragment !== 'undefined';
            },
            progress: (data) => 100,
            summary: (data) => 'React context available'
          };
        `,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMdxBundle,
      });

      const result = await validateInputBlock('react-gid', 'react-cid', {});

      expect(result).toEqual({
        isValid: true,
        progress: 100,
        message: 'React context available',
        id: undefined,
      });
    });

    it('should handle edge case with undefined data properties', async () => {
      const mockMdxBundle = {
        code: `
          return {
            validate: (data) => {
              return data && data.someProperty === 'expected';
            },
            progress: (data) => {
              return data && data.someProperty ? 100 : 0;
            },
            summary: (data) => {
              return data && data.someProperty ? 'Valid' : 'Invalid';
            }
          };
        `,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockMdxBundle,
      });

      const result = await validateInputBlock('edge-gid', 'edge-cid', {
        someProperty: 'expected',
      });

      expect(result).toEqual({
        isValid: true,
        progress: 100,
        message: 'Valid',
        id: undefined,
      });
    });
  });
}); 