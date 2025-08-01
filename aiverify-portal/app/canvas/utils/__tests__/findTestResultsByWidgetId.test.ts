import { findTestResultsByWidgetId } from '../findTestResultsByWidgetId';

// Create a simplified test result type for testing
type TestResult = {
  gid: string;
  cid: string;
  name: string;
  [key: string]: any;
};

describe('findTestResultsByWidgetId', () => {
  const mockTestResults: TestResult[] = [
    {
      gid: 'widget-1',
      cid: 'component-1',
      name: 'Test Result 1',
    },
    {
      gid: 'widget-1',
      cid: 'component-2',
      name: 'Test Result 2',
    },
    {
      gid: 'widget-2',
      cid: 'component-1',
      name: 'Test Result 3',
    },
    {
      gid: 'widget-1',
      cid: 'component-3',
      name: 'Test Result 4',
    },
  ];

  it('finds all test results for a specific widget gid', () => {
    const result = findTestResultsByWidgetId(
      mockTestResults as any,
      'widget-1'
    );

    expect(result).toHaveLength(3);
    expect(result[0].gid).toBe('widget-1');
    expect(result[0].cid).toBe('component-1');
    expect(result[0].name).toBe('Test Result 1');
    expect(result[1].gid).toBe('widget-1');
    expect(result[1].cid).toBe('component-2');
    expect(result[1].name).toBe('Test Result 2');
    expect(result[2].gid).toBe('widget-1');
    expect(result[2].cid).toBe('component-3');
    expect(result[2].name).toBe('Test Result 4');
  });

  it('finds single test result for widget gid', () => {
    const result = findTestResultsByWidgetId(
      mockTestResults as any,
      'widget-2'
    );

    expect(result).toHaveLength(1);
    expect(result[0].gid).toBe('widget-2');
    expect(result[0].cid).toBe('component-1');
    expect(result[0].name).toBe('Test Result 3');
  });

  it('returns empty array when no matching widget gid found', () => {
    const result = findTestResultsByWidgetId(
      mockTestResults as any,
      'nonexistent-widget'
    );

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('handles empty array', () => {
    const result = findTestResultsByWidgetId(
      [] as any,
      'widget-1'
    );

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('handles single item array with matching gid', () => {
    const singleItemArray: TestResult[] = [
      {
        gid: 'single-widget',
        cid: 'single-component',
        name: 'Single Test Result',
      },
    ];

    const result = findTestResultsByWidgetId(
      singleItemArray as any,
      'single-widget'
    );

    expect(result).toHaveLength(1);
    expect(result[0].gid).toBe('single-widget');
    expect(result[0].cid).toBe('single-component');
  });

  it('handles single item array with non-matching gid', () => {
    const singleItemArray: TestResult[] = [
      {
        gid: 'single-widget',
        cid: 'single-component',
        name: 'Single Test Result',
      },
    ];

    const result = findTestResultsByWidgetId(
      singleItemArray as any,
      'different-widget'
    );

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });
}); 