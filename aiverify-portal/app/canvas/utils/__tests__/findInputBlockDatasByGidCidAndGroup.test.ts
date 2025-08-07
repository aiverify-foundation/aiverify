import { findInputBlockDatasByGidCidAndGroup } from '../findInputBlockDatasByGidCidAndGroup';
import { InputBlockData } from '@/app/types';

describe('findInputBlockDatasByGidCidAndGroup', () => {
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

  it('should find an input block data by gid, cid, and group', () => {
    const result = findInputBlockDatasByGidCidAndGroup(
      mockInputBlockDatas,
      'group1',
      'category1',
      'Test Group 1'
    );
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.gid).toBe('group1');
    expect(result?.cid).toBe('category1');
    expect(result?.group).toBe('Test Group 1');
    expect(result?.name).toBe('Test Input Block 1');
  });

  it('should return undefined when no match is found', () => {
    const result = findInputBlockDatasByGidCidAndGroup(
      mockInputBlockDatas,
      'nonexistent',
      'category1',
      'Test Group 1'
    );
    
    expect(result).toBeUndefined();
  });

  it('should return undefined for empty array', () => {
    const result = findInputBlockDatasByGidCidAndGroup(
      [],
      'group1',
      'category1',
      'Test Group 1'
    );
    
    expect(result).toBeUndefined();
  });

  it('should find the first occurrence when multiple items match', () => {
    const duplicateData = [
      ...mockInputBlockDatas,
      {
        id: 5,
        gid: 'group1',
        cid: 'category1',
        name: 'Duplicate Input Block',
        group: 'Test Group 1',
        data: { test: 'duplicate' },
        created_at: '2023-01-05T00:00:00Z',
        updated_at: '2023-01-05T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDatasByGidCidAndGroup(
      duplicateData,
      'group1',
      'category1',
      'Test Group 1'
    );
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(1); // Should return the first occurrence
    expect(result?.name).toBe('Test Input Block 1');
  });

  it('should handle case-sensitive matching', () => {
    const result = findInputBlockDatasByGidCidAndGroup(
      mockInputBlockDatas,
      'GROUP1',
      'category1',
      'Test Group 1'
    );
    
    expect(result).toBeUndefined(); // Should not find due to case sensitivity
  });

  it('should handle empty string parameters', () => {
    const dataWithEmptyValues = [
      {
        id: 6,
        gid: '',
        cid: '',
        name: 'Empty Values Block',
        group: '',
        data: { test: 'empty' },
        created_at: '2023-01-06T00:00:00Z',
        updated_at: '2023-01-06T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDatasByGidCidAndGroup(
      dataWithEmptyValues,
      '',
      '',
      ''
    );
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(6);
    expect(result?.gid).toBe('');
    expect(result?.cid).toBe('');
    expect(result?.group).toBe('');
  });

  it('should handle special characters in parameters', () => {
    const dataWithSpecialChars = [
      {
        id: 7,
        gid: 'group-with-dashes',
        cid: 'category_with_underscores',
        name: 'Special Char Block',
        group: 'Group with spaces',
        data: { test: 'special' },
        created_at: '2023-01-07T00:00:00Z',
        updated_at: '2023-01-07T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDatasByGidCidAndGroup(
      dataWithSpecialChars,
      'group-with-dashes',
      'category_with_underscores',
      'Group with spaces'
    );
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(7);
    expect(result?.gid).toBe('group-with-dashes');
    expect(result?.cid).toBe('category_with_underscores');
    expect(result?.group).toBe('Group with spaces');
  });

  it('should handle very long string parameters', () => {
    const longString = 'a'.repeat(1000);
    const dataWithLongStrings = [
      {
        id: 8,
        gid: longString,
        cid: longString,
        name: 'Long String Block',
        group: longString,
        data: { test: 'long' },
        created_at: '2023-01-08T00:00:00Z',
        updated_at: '2023-01-08T00:00:00Z',
      },
    ];
    
    const result = findInputBlockDatasByGidCidAndGroup(
      dataWithLongStrings,
      longString,
      longString,
      longString
    );
    
    expect(result).toBeDefined();
    expect(result?.id).toBe(8);
    expect(result?.gid).toBe(longString);
    expect(result?.cid).toBe(longString);
    expect(result?.group).toBe(longString);
  });

  it('should handle partial matches correctly', () => {
    // Test that partial matches don't return results
    const result1 = findInputBlockDatasByGidCidAndGroup(
      mockInputBlockDatas,
      'group1',
      'category1',
      'Test Group 2' // Wrong group
    );
    
    const result2 = findInputBlockDatasByGidCidAndGroup(
      mockInputBlockDatas,
      'group1',
      'nonexistent-category', // Wrong cid that doesn't exist
      'Test Group 1'
    );
    
    const result3 = findInputBlockDatasByGidCidAndGroup(
      mockInputBlockDatas,
      'nonexistent-group', // Wrong gid that doesn't exist
      'category1',
      'Test Group 1'
    );
    
    expect(result1).toBeUndefined();
    expect(result2).toBeUndefined();
    expect(result3).toBeUndefined();
  });
}); 