import { findInputBlockDataById } from '../findInputBlockDataById';
import { InputBlockData } from '@/app/types';

describe('findInputBlockDataById', () => {
  const mockInputBlockDatas: InputBlockData[] = [
    {
      id: 1,
      gid: 'group1',
      cid: 'category1',
      name: 'Test 1',
      group: 'Test Group 1',
      data: { test: 'data1' },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      gid: 'group1',
      cid: 'category2',
      name: 'Test 2',
      group: 'Test Group 1',
      data: { test: 'data2' },
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
    {
      id: 3,
      gid: 'group2',
      cid: 'category1',
      name: 'Test 3',
      group: 'Test Group 2',
      data: { test: 'data3' },
      created_at: '2023-01-03T00:00:00Z',
      updated_at: '2023-01-03T00:00:00Z',
    },
  ];

  it('should find input block data by existing ID', () => {
    const result = findInputBlockDataById(mockInputBlockDatas, 2);
    expect(result).toEqual(mockInputBlockDatas[1]);
  });

  it('should return undefined for non-existing ID', () => {
    const result = findInputBlockDataById(mockInputBlockDatas, 999);
    expect(result).toBeUndefined();
  });

  it('should handle empty array', () => {
    const result = findInputBlockDataById([], 1);
    expect(result).toBeUndefined();
  });

  it('should find first element when searching for ID 1', () => {
    const result = findInputBlockDataById(mockInputBlockDatas, 1);
    expect(result).toEqual(mockInputBlockDatas[0]);
  });

  it('should find last element when searching for ID 3', () => {
    const result = findInputBlockDataById(mockInputBlockDatas, 3);
    expect(result).toEqual(mockInputBlockDatas[2]);
  });

  it('should handle array with single element', () => {
    const singleElementArray = [mockInputBlockDatas[0]];
    const result = findInputBlockDataById(singleElementArray, 1);
    expect(result).toEqual(mockInputBlockDatas[0]);
  });

  it('should return undefined for single element array with wrong ID', () => {
    const singleElementArray = [mockInputBlockDatas[0]];
    const result = findInputBlockDataById(singleElementArray, 999);
    expect(result).toBeUndefined();
  });
}); 