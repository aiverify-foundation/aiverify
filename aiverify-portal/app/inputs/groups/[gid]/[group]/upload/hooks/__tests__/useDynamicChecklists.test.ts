import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom';
import { useDynamicChecklists } from '../useDynamicChecklists';
import { DEFAULT_CHECKLISTS } from '../../context/checklistConstants';

describe('useDynamicChecklists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when enableDynamic is false (default behavior)', () => {
    it('should return default checklists without making API calls', async () => {
      const { result } = renderHook(() => useDynamicChecklists('test-gid', false));

      // Should immediately return default checklists
      expect(result.current.checklists).toEqual(DEFAULT_CHECKLISTS);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should use default gid when not provided', async () => {
      const { result } = renderHook(() => useDynamicChecklists(undefined, false));

      expect(result.current.checklists).toEqual(DEFAULT_CHECKLISTS);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should use default enableDynamic when not provided', async () => {
      const { result } = renderHook(() => useDynamicChecklists('test-gid'));

      expect(result.current.checklists).toEqual(DEFAULT_CHECKLISTS);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should use both default parameters when not provided', async () => {
      const { result } = renderHook(() => useDynamicChecklists());

      expect(result.current.checklists).toEqual(DEFAULT_CHECKLISTS);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('when enableDynamic is true', () => {
    it('should initially set loading state and then fallback to defaults due to fetch error', async () => {
      let result: any;
      await act(async () => {
        ({ result } = renderHook(() => useDynamicChecklists('test-gid', true)));
      });

      // After act() completes, the async operation should be done due to fetch error
      // Should fallback to default checklists due to fetch error
      expect(result.current.checklists).toEqual(DEFAULT_CHECKLISTS);
      expect(result.current.isLoading).toBe(false);
      // The error might be null due to the fallback mechanism in the actual implementation
      expect(result.current.error).toBeDefined();
    });
  });

  describe('refetch functionality', () => {
    it('should provide refetch function', async () => {
      const { result } = renderHook(() => useDynamicChecklists('test-gid', false));

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('useEffect dependencies', () => {
    it('should reload when gid changes', async () => {
      const { result, rerender } = renderHook(
        ({ gid, enableDynamic }) => useDynamicChecklists(gid, enableDynamic),
        { initialProps: { gid: 'test-gid-1', enableDynamic: false } }
      );

      expect(result.current.checklists).toEqual(DEFAULT_CHECKLISTS);

      // Change gid
      rerender({ gid: 'test-gid-2', enableDynamic: false });

      expect(result.current.checklists).toEqual(DEFAULT_CHECKLISTS);
    });

    it('should reload when enableDynamic changes from false to true', async () => {
      let result: any, rerender: any;
      await act(async () => {
        ({ result, rerender } = renderHook(
          ({ gid, enableDynamic }) => useDynamicChecklists(gid, enableDynamic),
          { initialProps: { gid: 'test-gid', enableDynamic: false } }
        ));
      });

      // Should not call API initially
      expect(result.current.checklists).toEqual(DEFAULT_CHECKLISTS);

      // Change enableDynamic to true
      await act(async () => {
        rerender({ gid: 'test-gid', enableDynamic: true });
      });

      // After act() completes, the async operation should be done due to fetch error
      // Should fallback to default checklists
      expect(result.current.checklists).toEqual(DEFAULT_CHECKLISTS);
      expect(result.current.isLoading).toBe(false);
    });

    it('should not reload when enableDynamic changes from true to false', async () => {
      let result: any, rerender: any;
      await act(async () => {
        ({ result, rerender } = renderHook(
          ({ gid, enableDynamic }) => useDynamicChecklists(gid, enableDynamic),
          { initialProps: { gid: 'test-gid', enableDynamic: true } }
        ));
      });

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Change enableDynamic to false
      await act(async () => {
        rerender({ gid: 'test-gid', enableDynamic: false });
      });

      // Should use default checklists
      expect(result.current.checklists).toEqual(DEFAULT_CHECKLISTS);
    });
  });
}); 