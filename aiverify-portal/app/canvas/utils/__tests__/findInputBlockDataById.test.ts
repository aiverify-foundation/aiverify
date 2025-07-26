import { findInputBlockDataById } from '../findInputBlockDataById';
import { InputBlockData } from '@/app/types';

describe('findInputBlockDataById', () => {
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
  ];

  it('should find an input block data by its ID', () => {
    const result = findInputBlockDataById(mockInputBlockDatas, 2);
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(2);
    expect(result?.gid).toBe('group1');
    expect(result?.cid).toBe('category2');
    expect(result?.name).toBe('Test Input Block 2');
    expect(result?.group).toBe('Test Group 1');
    expect(result?.data).toEqual({ test: 'data2' });
  });

  it('should return undefined when input block data is not found', () => {
    const result = findInputBlockDataById(mockInputBlockDatas, 999);
    
    expect(result).toBeUndefined();
  });

  it('should return undefined for empty array', () => {
    const result = findInputBlockDataById([], 1);
    
    expect(result).toBeUndefined();
  });

  it('should find the first occurrence when multiple items have the same ID', () => {
    const duplicateData = [
      ...mockInputBlockDatas,
      {
        id: 1,
        gid: 'group3',
        cid: 'category3',
        name: 'Duplicate Input Block',
        group: 'Test Group 3',
        data: { test: 'duplicate' },
        created_at: '2023-01-04T00:00:00Z',
        updated_at: '2023-01-04T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDataById(duplicateData, 1);
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.gid).toBe('group1'); // Should return the first occurrence
  });

  it('should handle negative ID values', () => {
    const dataWithNegativeId = [
      {
        id: -1,
        gid: 'group1',
        cid: 'category1',
        name: 'Negative ID Block',
        group: 'Test Group 1',
        data: { test: 'negative' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDataById(dataWithNegativeId, -1);
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(-1);
  });

  it('should handle zero ID values', () => {
    const dataWithZeroId = [
      {
        id: 0,
        gid: 'group1',
        cid: 'category1',
        name: 'Zero ID Block',
        group: 'Test Group 1',
        data: { test: 'zero' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDataById(dataWithZeroId, 0);
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(0);
  });

  it('should handle large ID values', () => {
    const largeId = Number.MAX_SAFE_INTEGER;
    const dataWithLargeId = [
      {
        id: largeId,
        gid: 'group1',
        cid: 'category1',
        name: 'Large ID Block',
        group: 'Test Group 1',
        data: { test: 'large' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDataById(dataWithLargeId, largeId);
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(largeId);
  });

  it('should handle string ID values that can be converted to numbers', () => {
    const dataWithStringId = [
      {
        id: 123,
        gid: 'group1',
        cid: 'category1',
        name: 'String ID Block',
        group: 'Test Group 1',
        data: { test: 'string' },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDataById(dataWithStringId, 123);
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(123);
  });
}); 