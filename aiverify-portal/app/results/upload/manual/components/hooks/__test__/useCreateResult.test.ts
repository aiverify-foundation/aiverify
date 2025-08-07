import { renderHook, act } from '@testing-library/react';
import { useCreateResult } from '../useCreateResult';

jest.mock('../../utils/createResult', () => ({
  createResult: jest.fn(),
}));

const mockCreateResult = require('../../utils/createResult').createResult;

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useMutation: jest.fn(),
  };
});

const mockUseMutation = require('@tanstack/react-query').useMutation;

describe('useCreateResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls createResult and returns success', async () => {
    mockCreateResult.mockResolvedValue(['url1', 'url2']);
    let mutateFn: any;
    mockUseMutation.mockImplementation(({ mutationFn }: any) => {
      mutateFn = mutationFn;
      return { mutateAsync: mutationFn };
    });
    const { result } = renderHook(() => useCreateResult());
    const payload = { jsonData: { foo: 'bar' }, files: [] };
    const res = await act(() => result.current.mutateAsync(payload));
    expect(mockCreateResult).toHaveBeenCalledWith(payload);
    expect(res).toEqual(['url1', 'url2']);
  });

  it('handles error from createResult', async () => {
    const error = { detail: 'Upload failed' };
    mockCreateResult.mockRejectedValue(error);
    mockUseMutation.mockImplementation(({ mutationFn }: any) => {
      return { mutateAsync: mutationFn };
    });
    const { result } = renderHook(() => useCreateResult());
    const payload = { jsonData: { foo: 'bar' }, files: [] };
    await expect(result.current.mutateAsync(payload)).rejects.toEqual(error);
  });
}); 