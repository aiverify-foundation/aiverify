import { describe, it, expect } from '@jest/globals';
import { isPythonFastApiError, isErrorWithMessage, toErrorWithMessage } from '../errorTypes';

describe('errorTypes', () => {
  describe('isPythonFastApiError', () => {
    it('should return true for valid Python FastAPI error', () => {
      const error = {
        status: 400,
        data: {
          detail: 'Validation error'
        }
      };
      
      expect(isPythonFastApiError(error)).toBe(true);
    });

    it('should return false for non-object values', () => {
      expect(isPythonFastApiError('string error')).toBe(false);
      expect(isPythonFastApiError(123)).toBe(false);
      expect(isPythonFastApiError(null)).toBe(false);
      expect(isPythonFastApiError(undefined)).toBe(false);
    });

    it('should return false for null object', () => {
      expect(isPythonFastApiError(null)).toBe(false);
    });

    it('should return false for object without data property', () => {
      const error = { status: 400 };
      expect(isPythonFastApiError(error)).toBe(false);
    });

    it('should return false for object with non-object data', () => {
      const error = { status: 400, data: 'not an object' };
      expect(isPythonFastApiError(error)).toBe(false);
    });

    it('should return false for object with null data', () => {
      const error = { status: 400, data: null };
      expect(isPythonFastApiError(error)).toBe(false);
    });

    it('should return false for object without detail property', () => {
      const error = { status: 400, data: { message: 'error' } };
      expect(isPythonFastApiError(error)).toBe(false);
    });

    it('should return false for object with non-string detail', () => {
      const error = { status: 400, data: { detail: 123 } };
      expect(isPythonFastApiError(error)).toBe(false);
    });
  });

  describe('isErrorWithMessage', () => {
    it('should return true for Error objects', () => {
      const error = new Error('Test error');
      expect(isErrorWithMessage(error)).toBe(true);
    });

    it('should return true for objects with message property', () => {
      const error = { message: 'Custom error' };
      expect(isErrorWithMessage(error)).toBe(true);
    });

    it('should return false for non-object values', () => {
      expect(isErrorWithMessage('string')).toBe(false);
      expect(isErrorWithMessage(123)).toBe(false);
      expect(isErrorWithMessage(null)).toBe(false);
      expect(isErrorWithMessage(undefined)).toBe(false);
    });

    it('should return false for null object', () => {
      expect(isErrorWithMessage(null)).toBe(false);
    });

    it('should return false for object without message property', () => {
      const error = { status: 400 };
      expect(isErrorWithMessage(error)).toBe(false);
    });

    it('should return false for object with non-string message', () => {
      const error = { message: 123 };
      expect(isErrorWithMessage(error)).toBe(false);
    });
  });

  describe('toErrorWithMessage', () => {
    it('should convert Python FastAPI error to Error', () => {
      const fastApiError = {
        status: 400,
        data: {
          detail: 'Validation error'
        }
      };
      
      const result = toErrorWithMessage(fastApiError);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Validation error');
    });

    it('should return existing Error objects unchanged', () => {
      const originalError = new Error('Original error');
      const result = toErrorWithMessage(originalError);
      expect(result).toBe(originalError);
    });

    it('should return objects with message property unchanged', () => {
      const errorWithMessage = { message: 'Custom error' };
      const result = toErrorWithMessage(errorWithMessage);
      expect(result).toBe(errorWithMessage);
    });

    it('should convert string to Error', () => {
      const result = toErrorWithMessage('String error');
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('String error');
    });

    it('should convert simple objects to Error with JSON string', () => {
      const simpleObject = { key: 'value', number: 123 };
      const result = toErrorWithMessage(simpleObject);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('{"key":"value","number":123}');
    });

    it('should handle objects that cannot be JSON stringified', () => {
      const circularObject: Record<string, unknown> = {};
      circularObject.self = circularObject;
      
      const result = toErrorWithMessage(circularObject);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('[object Object]');
    });

    it('should handle other primitive types', () => {
      const numberResult = toErrorWithMessage(123);
      expect(numberResult).toBeInstanceOf(Error);
      expect(numberResult.message).toBe('123');

      const booleanResult = toErrorWithMessage(true);
      expect(booleanResult).toBeInstanceOf(Error);
      expect(booleanResult.message).toBe('true');
    });
  });
}); 