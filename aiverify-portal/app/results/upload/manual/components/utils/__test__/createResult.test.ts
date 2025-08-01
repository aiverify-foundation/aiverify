import { createResult } from '../createResult';

describe('createResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits form data and returns result on success', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(['url1', 'url2']),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse as any);
    const payload = { jsonData: { foo: 'bar' }, files: [] };
    const result = await createResult(payload);
    expect(global.fetch).toHaveBeenCalledWith('/api/test_results/upload', expect.objectContaining({ method: 'POST' }));
    expect(result).toEqual(['url1', 'url2']);
  });

  it('throws error with detail on API error', async () => {
    const errorDetail = { detail: 'Upload failed' };
    const mockResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue(errorDetail),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse as any);
    const payload = { jsonData: { foo: 'bar' }, files: [] };
    await expect(createResult(payload)).rejects.toEqual(errorDetail);
  });

  it('throws error on network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    const payload = { jsonData: { foo: 'bar' }, files: [] };
    await expect(createResult(payload)).rejects.toThrow('Network error');
  });
}); 