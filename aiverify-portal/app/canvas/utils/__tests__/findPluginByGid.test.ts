import { findPluginByGid } from '../findPluginByGid';
import { Plugin } from '@/app/types';

describe('findPluginByGid', () => {
  const mockPlugins: Plugin[] = [
    {
      gid: 'plugin1',
      version: '1.0.0',
      name: 'Test Plugin 1',
      author: 'Author 1',
      description: 'Description 1',
      url: 'http://example1.com',
      meta: 'meta1',
      is_stock: true,
      zip_hash: 'hash1',
      algorithms: [],
      widgets: [],
      input_blocks: [],
      templates: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      gid: 'plugin2',
      version: '2.0.0',
      name: 'Test Plugin 2',
      author: 'Author 2',
      description: 'Description 2',
      url: 'http://example2.com',
      meta: 'meta2',
      is_stock: false,
      zip_hash: 'hash2',
      algorithms: [],
      widgets: [],
      input_blocks: [],
      templates: [],
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
    {
      gid: 'plugin3',
      version: '3.0.0',
      name: 'Test Plugin 3',
      author: null,
      description: null,
      url: null,
      meta: 'meta3',
      is_stock: true,
      zip_hash: 'hash3',
      algorithms: [],
      widgets: [],
      input_blocks: [],
      templates: [],
      created_at: '2023-01-03T00:00:00Z',
      updated_at: '2023-01-03T00:00:00Z',
    },
  ];

  it('should find plugin by existing gid', () => {
    const result = findPluginByGid(mockPlugins, 'plugin2');
    expect(result).toEqual(mockPlugins[1]);
  });

  it('should return undefined for non-existing gid', () => {
    const result = findPluginByGid(mockPlugins, 'nonexistent');
    expect(result).toBeUndefined();
  });

  it('should handle empty array', () => {
    const result = findPluginByGid([], 'plugin1');
    expect(result).toBeUndefined();
  });

  it('should find first plugin when searching for plugin1', () => {
    const result = findPluginByGid(mockPlugins, 'plugin1');
    expect(result).toEqual(mockPlugins[0]);
  });

  it('should find last plugin when searching for plugin3', () => {
    const result = findPluginByGid(mockPlugins, 'plugin3');
    expect(result).toEqual(mockPlugins[2]);
  });

  it('should handle array with single plugin', () => {
    const singlePluginArray = [mockPlugins[0]];
    const result = findPluginByGid(singlePluginArray, 'plugin1');
    expect(result).toEqual(mockPlugins[0]);
  });

  it('should return undefined for single plugin array with wrong gid', () => {
    const singlePluginArray = [mockPlugins[0]];
    const result = findPluginByGid(singlePluginArray, 'wrong-gid');
    expect(result).toBeUndefined();
  });

  it('should handle case-sensitive gid matching', () => {
    const result = findPluginByGid(mockPlugins, 'PLUGIN1');
    expect(result).toBeUndefined();
  });

  it('should handle empty string gid', () => {
    const result = findPluginByGid(mockPlugins, '');
    expect(result).toBeUndefined();
  });
}); 