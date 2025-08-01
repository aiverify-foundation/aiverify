import { findTestResultByAlgoGidAndCid } from '../findTestResultByAlgoGidAndCid';

// Create a simplified test result type for testing
type TestResult = {
  gid: string;
  cid: string;
  name: string;
  [key: string]: any;
};

describe('findTestResultByAlgoGidAndCid', () => {
  const mockTestResults: TestResult[] = [
    {
      gid: 'test-plugin-1',
      cid: 'test-component-1',
      name: 'Test Result 1',
    },
    {
      gid: 'test-plugin-1',
      cid: 'test-component-2',
      name: 'Test Result 2',
    },
    {
      gid: 'test-plugin-2',
      cid: 'test-component-1',
      name: 'Test Result 3',
    },
  ];

  it('finds test result with matching gid and cid', () => {
    const result = findTestResultByAlgoGidAndCid(
      mockTestResults as any,
      'test-plugin-1',
      'test-component-1'
    );

    expect(result).toBeDefined();
    expect(result?.gid).toBe('test-plugin-1');
    expect(result?.cid).toBe('test-component-1');
    expect(result?.name).toBe('Test Result 1');
  });

  it('finds test result with different gid but same cid', () => {
    const result = findTestResultByAlgoGidAndCid(
      mockTestResults as any,
      'test-plugin-2',
      'test-component-1'
    );

    expect(result).toBeDefined();
    expect(result?.gid).toBe('test-plugin-2');
    expect(result?.cid).toBe('test-component-1');
    expect(result?.name).toBe('Test Result 3');
  });

  it('finds test result with same gid but different cid', () => {
    const result = findTestResultByAlgoGidAndCid(
      mockTestResults as any,
      'test-plugin-1',
      'test-component-2'
    );

    expect(result).toBeDefined();
    expect(result?.gid).toBe('test-plugin-1');
    expect(result?.cid).toBe('test-component-2');
    expect(result?.name).toBe('Test Result 2');
  });

  it('returns undefined when no matching gid and cid found', () => {
    const result = findTestResultByAlgoGidAndCid(
      mockTestResults as any,
      'nonexistent-plugin',
      'nonexistent-component'
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined when gid matches but cid does not', () => {
    const result = findTestResultByAlgoGidAndCid(
      mockTestResults as any,
      'test-plugin-1',
      'nonexistent-component'
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined when cid matches but gid does not', () => {
    const result = findTestResultByAlgoGidAndCid(
      mockTestResults as any,
      'nonexistent-plugin',
      'test-component-1'
    );

    expect(result).toBeUndefined();
  });

  it('handles empty array', () => {
    const result = findTestResultByAlgoGidAndCid(
      [] as any,
      'test-plugin-1',
      'test-component-1'
    );

    expect(result).toBeUndefined();
  });

  it('handles single item array', () => {
    const singleItemArray: TestResult[] = [
      {
        gid: 'single-plugin',
        cid: 'single-component',
        name: 'Single Test Result',
      },
    ];

    const result = findTestResultByAlgoGidAndCid(
      singleItemArray as any,
      'single-plugin',
      'single-component'
    );

    expect(result).toBeDefined();
    expect(result?.gid).toBe('single-plugin');
    expect(result?.cid).toBe('single-component');
  });
}); 