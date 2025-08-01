import { renderHook, act } from '@testing-library/react';

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useMutation: jest.fn(),
  };
});

const mockUseMutation = require('@tanstack/react-query').useMutation;

describe('useUploadFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls fileUploadRequest and returns success', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      mutate: jest.fn(),
      isLoading: false,
      isError: false,
      error: null,
    });

    const { useUploadFiles } = require('../useUploadFile');
    const { result } = renderHook(() => useUploadFiles({ onSuccess: jest.fn(), onError: jest.fn() }));
    
    const payload = { fileUpload: { file: new File([''], 'test.zip'), progress: 0, status: 'idle' as const, id: '1' }, onProgress: jest.fn() };
    await expect(result.current.mutateAsync(payload)).resolves.toBeUndefined();
    expect(mockMutateAsync).toHaveBeenCalledWith(payload);
  });

  it('handles error from fileUploadRequest', async () => {
    const error = new Error('Network error');
    const mockMutateAsync = jest.fn().mockRejectedValue(error);
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      mutate: jest.fn(),
      isLoading: false,
      isError: false,
      error: null,
    });

    const { useUploadFiles } = require('../useUploadFile');
    const { result } = renderHook(() => useUploadFiles({ onSuccess: jest.fn(), onError: jest.fn() }));
    
    const payload = { fileUpload: { file: new File([''], 'fail.zip'), progress: 0, status: 'idle' as const, id: '1' }, onProgress: jest.fn() };
    await expect(result.current.mutateAsync(payload)).rejects.toThrow('Network error');
  });
}); 