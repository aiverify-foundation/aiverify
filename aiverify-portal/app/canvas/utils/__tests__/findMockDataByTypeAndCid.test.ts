import { findMockDataByTypeAndCid } from '../findMockDataByTypeAndCid';
import { MockData } from '@/app/types';

describe('findMockDataByTypeAndCid', () => {
  const mockMockData: MockData[] = [
    {
      type: 'Algorithm',
      gid: 'plugin1',
      cid: 'algo1',
      data: { test: 'data1' },
    },
    {
      type: 'Algorithm',
      gid: 'plugin1',
      cid: 'algo2',
      data: { test: 'data2' },
    },
    {
      type: 'InputBlock',
      gid: 'plugin2',
      cid: 'input1',
      data: { test: 'data3' },
    },
    {
      type: 'InputBlock',
      gid: 'plugin2',
      cid: 'input2',
      data: { test: 'data4' },
    },
    {
      type: 'Algorithm',
      gid: null,
      cid: 'algo3',
      data: { test: 'data5' },
    },
  ];

  it('should find mock data by type and cid', () => {
    const result = findMockDataByTypeAndCid(
      mockMockData,
      'Algorithm',
      'algo1'
    );
    
    expect(result).toBeDefined();
    expect(result?.type).toBe('Algorithm');
    expect(result?.gid).toBe('plugin1');
    expect(result?.cid).toBe('algo1');
    expect(result?.data).toEqual({ test: 'data1' });
  });

  it('should return undefined when no match is found', () => {
    const result = findMockDataByTypeAndCid(
      mockMockData,
      'Algorithm',
      'nonexistent'
    );
    
    expect(result).toBeUndefined();
  });

  it('should return undefined for empty array', () => {
    const result = findMockDataByTypeAndCid(
      [],
      'Algorithm',
      'algo1'
    );
    
    expect(result).toBeUndefined();
  });

  it('should find the first occurrence when multiple items match', () => {
    const duplicateData: MockData[] = [
      ...mockMockData,
      {
        type: 'Algorithm',
        gid: 'plugin1',
        cid: 'algo1',
        data: { test: 'duplicate' },
      },
    ];
    
    const result = findMockDataByTypeAndCid(
      duplicateData,
      'Algorithm',
      'algo1'
    );
    
    expect(result).toBeDefined();
    expect(result?.data).toEqual({ test: 'data1' }); // Should return the first occurrence
  });

  it('should handle case-sensitive matching', () => {
    const result = findMockDataByTypeAndCid(
      mockMockData,
      'Algorithm',
      'ALGO1'
    );
    
    expect(result).toBeUndefined(); // Should not find due to case sensitivity
  });

  it('should handle null gid values', () => {
    const result = findMockDataByTypeAndCid(
      mockMockData,
      'Algorithm',
      'algo3'
    );
    
    expect(result).toBeDefined();
    expect(result?.type).toBe('Algorithm');
    expect(result?.gid).toBeNull();
    expect(result?.cid).toBe('algo3');
    expect(result?.data).toEqual({ test: 'data5' });
  });

  it('should handle different data types', () => {
    const dataWithDifferentTypes: MockData[] = [
      {
        type: 'Algorithm',
        gid: 'plugin1',
        cid: 'algo1',
        data: {
          string: 'test',
          number: 123,
          boolean: true,
          array: [1, 2, 3],
          object: { nested: 'value' },
        },
      },
    ];
    
    const result = findMockDataByTypeAndCid(
      dataWithDifferentTypes,
      'Algorithm',
      'algo1'
    );
    
    expect(result).toBeDefined();
    expect(result?.data).toEqual({
      string: 'test',
      number: 123,
      boolean: true,
      array: [1, 2, 3],
      object: { nested: 'value' },
    });
  });

  it('should handle artifacts property', () => {
    const dataWithArtifacts: MockData[] = [
      {
        type: 'Algorithm',
        gid: 'plugin1',
        cid: 'algo1',
        data: { test: 'data' },
        artifacts: ['artifact1.txt', 'artifact2.json'],
      },
    ];
    
    const result = findMockDataByTypeAndCid(
      dataWithArtifacts,
      'Algorithm',
      'algo1'
    );
    
    expect(result).toBeDefined();
    expect(result?.artifacts).toEqual(['artifact1.txt', 'artifact2.json']);
  });

  it('should handle partial matches correctly', () => {
    // Test that partial matches don't return results
    const result1 = findMockDataByTypeAndCid(
      mockMockData,
      'Algorithm',
      'algo' // Partial cid
    );
    
    expect(result1).toBeUndefined();
  });

  it('should handle InputBlock type correctly', () => {
    const result = findMockDataByTypeAndCid(
      mockMockData,
      'InputBlock',
      'input1'
    );
    
    expect(result).toBeDefined();
    expect(result?.type).toBe('InputBlock');
    expect(result?.gid).toBe('plugin2');
    expect(result?.cid).toBe('input1');
    expect(result?.data).toEqual({ test: 'data3' });
  });

  it('should handle special characters in cid', () => {
    const dataWithSpecialChars: MockData[] = [
      {
        type: 'Algorithm',
        gid: 'plugin1',
        cid: 'algo-with-special-chars',
        data: { test: 'special' },
      },
    ];
    
    const result = findMockDataByTypeAndCid(
      dataWithSpecialChars,
      'Algorithm',
      'algo-with-special-chars'
    );
    
    expect(result).toBeDefined();
    expect(result?.type).toBe('Algorithm');
    expect(result?.cid).toBe('algo-with-special-chars');
    expect(result?.data).toEqual({ test: 'special' });
  });

  it('should handle very long string parameters', () => {
    const longString = 'a'.repeat(1000);
    const dataWithLongStrings: MockData[] = [
      {
        type: 'Algorithm',
        gid: 'plugin1',
        cid: longString,
        data: { test: 'long' },
      },
    ];
    
    const result = findMockDataByTypeAndCid(
      dataWithLongStrings,
      'Algorithm',
      longString
    );
    
    expect(result).toBeDefined();
    expect(result?.type).toBe('Algorithm');
    expect(result?.cid).toBe(longString);
    expect(result?.data).toEqual({ test: 'long' });
  });
}); 