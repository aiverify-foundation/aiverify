import { findInputBlockDataByGidAndCid } from '../findInputBlockDataByGidAndCid';
import { InputBlockData } from '@/app/types';

describe('findInputBlockDataByGidAndCid', () => {
  const mockInputBlockDatas: InputBlockData[] = [
    {
      id: 1,
      gid: 'group1',
      cid: 'category1',
      name: 'Test Input Block 1',
      group: 'Test Group 1',
      data: { test: 'data1' },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      gid: 'group1',
      cid: 'category2',
      name: 'Test Input Block 2',
      group: 'Test Group 1',
      data: { test: 'data2' },
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
    {
      id: 3,
      gid: 'group2',
      cid: 'category1',
      name: 'Test Input Block 3',
      group: 'Test Group 2',
      data: { test: 'data3' },
      created_at: '2023-01-03T00:00:00Z',
      updated_at: '2023-01-03T00:00:00Z',
    },
    {
      id: 4,
      gid: 'group1',
      cid: 'category1',
      name: 'Test Input Block 4',
      group: 'Test Group 3',
      data: { test: 'data4' },
      created_at: '2023-01-04T00:00:00Z',
      updated_at: '2023-01-04T00:00:00Z',
    },
  ];

  it('should find an input block data by gid and cid', () => {
    const result = findInputBlockDataByGidAndCid(
      mockInputBlockDatas,
      'group1',
      'category1'
    );
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.gid).toBe('group1');
    expect(result?.cid).toBe('category1');
    expect(result?.name).toBe('Test Input Block 1');
    expect(result?.group).toBe('Test Group 1');
    expect(result?.data).toEqual({ test: 'data1' });
  });

  it('should return undefined when no match is found', () => {
    const result = findInputBlockDataByGidAndCid(
      mockInputBlockDatas,
      'nonexistent',
      'category1'
    );
    
    expect(result).toBeUndefined();
  });

  it('should return undefined for empty array', () => {
    const result = findInputBlockDataByGidAndCid(
      [],
      'group1',
      'category1'
    );
    
    expect(result).toBeUndefined();
  });

  it('should find the first occurrence when multiple items match', () => {
    const result = findInputBlockDataByGidAndCid(
      mockInputBlockDatas,
      'group1',
      'category1'
    );
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(1); // Should return the first occurrence
    expect(result?.name).toBe('Test Input Block 1');
  });

  it('should handle case-sensitive matching', () => {
    const result = findInputBlockDataByGidAndCid(
      mockInputBlockDatas,
      'GROUP1',
      'category1'
    );
    
    expect(result).toBeUndefined(); // Should not find due to case sensitivity
  });

  it('should handle empty string parameters', () => {
    const dataWithEmptyValues: InputBlockData[] = [
      {
        id: 5,
        gid: '',
        cid: '',
        name: 'Empty Values Block',
        group: 'Test Group',
        data: { test: 'empty' },
        created_at: '2023-01-05T00:00:00Z',
        updated_at: '2023-01-05T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDataByGidAndCid(
      dataWithEmptyValues,
      '',
      ''
    );
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(5);
    expect(result?.gid).toBe('');
    expect(result?.cid).toBe('');
    expect(result?.name).toBe('Empty Values Block');
  });

  it('should handle special characters in parameters', () => {
    const dataWithSpecialChars: InputBlockData[] = [
      {
        id: 6,
        gid: 'group-with-dashes',
        cid: 'category_with_underscores',
        name: 'Special Char Block',
        group: 'Test Group',
        data: { test: 'special' },
        created_at: '2023-01-06T00:00:00Z',
        updated_at: '2023-01-06T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDataByGidAndCid(
      dataWithSpecialChars,
      'group-with-dashes',
      'category_with_underscores'
    );
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(6);
    expect(result?.gid).toBe('group-with-dashes');
    expect(result?.cid).toBe('category_with_underscores');
    expect(result?.name).toBe('Special Char Block');
  });

  it('should handle very long string parameters', () => {
    const longString = 'a'.repeat(1000);
    const dataWithLongStrings: InputBlockData[] = [
      {
        id: 7,
        gid: longString,
        cid: longString,
        name: 'Long String Block',
        group: 'Test Group',
        data: { test: 'long' },
        created_at: '2023-01-07T00:00:00Z',
        updated_at: '2023-01-07T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDataByGidAndCid(
      dataWithLongStrings,
      longString,
      longString
    );
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(7);
    expect(result?.gid).toBe(longString);
    expect(result?.cid).toBe(longString);
    expect(result?.name).toBe('Long String Block');
  });

  it('should handle partial matches correctly', () => {
    // Test that partial matches don't return results
    const result1 = findInputBlockDataByGidAndCid(
      mockInputBlockDatas,
      'group1',
      'category' // Partial cid
    );
    
    const result2 = findInputBlockDataByGidAndCid(
      mockInputBlockDatas,
      'group', // Partial gid
      'category1'
    );
    
    expect(result1).toBeUndefined();
    expect(result2).toBeUndefined();
  });

  it('should handle different data types in the data field', () => {
    const dataWithDifferentTypes: InputBlockData[] = [
      {
        id: 8,
        gid: 'group1',
        cid: 'category1',
        name: 'Different Types Block',
        group: 'Test Group',
        data: {
          string: 'test',
          number: 123,
          boolean: true,
          array: [1, 2, 3],
          object: { nested: 'value' },
        },
        created_at: '2023-01-08T00:00:00Z',
        updated_at: '2023-01-08T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDataByGidAndCid(
      dataWithDifferentTypes,
      'group1',
      'category1'
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

  it('should handle complex nested data structures', () => {
    const dataWithComplexStructures: InputBlockData[] = [
      {
        id: 9,
        gid: 'group1',
        cid: 'category1',
        name: 'Complex Data Block',
        group: 'Test Group',
        data: {
          nested: {
            level1: {
              level2: {
                level3: 'deep value',
                array: [1, 2, 3, 4, 5],
              },
            },
          },
          mixed: [
            { type: 'object', value: 'test' },
            { type: 'number', value: 42 },
            { type: 'boolean', value: true },
          ],
        },
        created_at: '2023-01-09T00:00:00Z',
        updated_at: '2023-01-09T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDataByGidAndCid(
      dataWithComplexStructures,
      'group1',
      'category1'
    );
    
    expect(result).toBeDefined();
    expect(result?.data).toEqual({
      nested: {
        level1: {
          level2: {
            level3: 'deep value',
            array: [1, 2, 3, 4, 5],
          },
        },
      },
      mixed: [
        { type: 'object', value: 'test' },
        { type: 'number', value: 42 },
        { type: 'boolean', value: true },
      ],
    });
  });

  it('should handle empty data objects', () => {
    const dataWithEmptyData: InputBlockData[] = [
      {
        id: 10,
        gid: 'group1',
        cid: 'category1',
        name: 'Empty Data Block',
        group: 'Test Group',
        data: {},
        created_at: '2023-01-10T00:00:00Z',
        updated_at: '2023-01-10T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDataByGidAndCid(
      dataWithEmptyData,
      'group1',
      'category1'
    );
    
    expect(result).toBeDefined();
    expect(result?.data).toEqual({});
  });

  it('should handle different group names', () => {
    const result1 = findInputBlockDataByGidAndCid(
      mockInputBlockDatas,
      'group1',
      'category1'
    );
    
    const result2 = findInputBlockDataByGidAndCid(
      mockInputBlockDatas,
      'group2',
      'category1'
    );
    
    expect(result1?.group).toBe('Test Group 1');
    expect(result2?.group).toBe('Test Group 2');
  });

  it('should handle different cid values', () => {
    const result1 = findInputBlockDataByGidAndCid(
      mockInputBlockDatas,
      'group1',
      'category1'
    );
    
    const result2 = findInputBlockDataByGidAndCid(
      mockInputBlockDatas,
      'group1',
      'category2'
    );
    
    expect(result1?.cid).toBe('category1');
    expect(result2?.cid).toBe('category2');
  });
}); 