import { findPluginByGid } from '../findPluginByGid';
import { Plugin } from '@/app/types';

describe('findPluginByGid', () => {
  const mockPlugins: Plugin[] = [
    {
      gid: 'plugin1',
      version: '1.0.0',
      name: 'Test Plugin 1',
      author: 'Test Author 1',
      description: 'Test Description 1',
      url: 'https://example.com/plugin1',
      meta: '{"key": "value1"}',
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
      author: 'Test Author 2',
      description: 'Test Description 2',
      url: 'https://example.com/plugin2',
      meta: '{"key": "value2"}',
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
      version: '1.5.0',
      name: 'Test Plugin 3',
      author: null,
      description: null,
      url: null,
      meta: '{"key": "value3"}',
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

  it('should find a plugin by its gid', () => {
    const result = findPluginByGid(mockPlugins, 'plugin2');
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('plugin2');
    expect(result?.name).toBe('Test Plugin 2');
    expect(result?.version).toBe('2.0.0');
    expect(result?.author).toBe('Test Author 2');
    expect(result?.is_stock).toBe(false);
  });

  it('should return undefined when plugin is not found', () => {
    const result = findPluginByGid(mockPlugins, 'nonexistent');
    
    expect(result).toBeUndefined();
  });

  it('should return undefined for empty array', () => {
    const result = findPluginByGid([], 'plugin1');
    
    expect(result).toBeUndefined();
  });

  it('should find the first occurrence when multiple plugins have the same gid', () => {
    const duplicatePlugins = [
      ...mockPlugins,
      {
        gid: 'plugin1',
        version: '3.0.0',
        name: 'Duplicate Plugin',
        author: 'Duplicate Author',
        description: 'Duplicate Description',
        url: 'https://example.com/duplicate',
        meta: '{"key": "duplicate"}',
        is_stock: false,
        zip_hash: 'duplicate_hash',
        algorithms: [],
        widgets: [],
        input_blocks: [],
        templates: [],
        created_at: '2023-01-04T00:00:00Z',
        updated_at: '2023-01-04T00:00:00Z',
      },
    ];
    
    const result = findPluginByGid(duplicatePlugins, 'plugin1');
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('plugin1');
    expect(result?.name).toBe('Test Plugin 1'); // Should return the first occurrence
  });

  it('should handle plugins with null values', () => {
    const result = findPluginByGid(mockPlugins, 'plugin3');
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('plugin3');
    expect(result?.author).toBeNull();
    expect(result?.description).toBeNull();
    expect(result?.url).toBeNull();
  });

  it('should handle case-sensitive gid matching', () => {
    const result = findPluginByGid(mockPlugins, 'PLUGIN1');
    
    expect(result).toBeUndefined(); // Should not find due to case sensitivity
  });

  it('should handle empty string gid', () => {
    const pluginsWithEmptyGid = [
      {
        gid: '',
        version: '1.0.0',
        name: 'Empty GID Plugin',
        author: 'Test Author',
        description: 'Test Description',
        url: 'https://example.com/empty',
        meta: '{"key": "empty"}',
        is_stock: true,
        zip_hash: 'empty_hash',
        algorithms: [],
        widgets: [],
        input_blocks: [],
        templates: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findPluginByGid(pluginsWithEmptyGid, '');
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('');
  });

  it('should handle special characters in gid', () => {
    const pluginsWithSpecialChars = [
      {
        gid: 'plugin-with-dashes',
        version: '1.0.0',
        name: 'Special Char Plugin',
        author: 'Test Author',
        description: 'Test Description',
        url: 'https://example.com/special',
        meta: '{"key": "special"}',
        is_stock: true,
        zip_hash: 'special_hash',
        algorithms: [],
        widgets: [],
        input_blocks: [],
        templates: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
      {
        gid: 'plugin_with_underscores',
        version: '1.0.0',
        name: 'Underscore Plugin',
        author: 'Test Author',
        description: 'Test Description',
        url: 'https://example.com/underscore',
        meta: '{"key": "underscore"}',
        is_stock: true,
        zip_hash: 'underscore_hash',
        algorithms: [],
        widgets: [],
        input_blocks: [],
        templates: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result1 = findPluginByGid(pluginsWithSpecialChars, 'plugin-with-dashes');
    const result2 = findPluginByGid(pluginsWithSpecialChars, 'plugin_with_underscores');
    
    expect(result1).toBeDefined();
    expect(result1?.gid).toBe('plugin-with-dashes');
    expect(result2).toBeDefined();
    expect(result2?.gid).toBe('plugin_with_underscores');
  });

  it('should handle very long gid strings', () => {
    const longGid = 'a'.repeat(1000);
    const pluginsWithLongGid = [
      {
        gid: longGid,
        version: '1.0.0',
        name: 'Long GID Plugin',
        author: 'Test Author',
        description: 'Test Description',
        url: 'https://example.com/long',
        meta: '{"key": "long"}',
        is_stock: true,
        zip_hash: 'long_hash',
        algorithms: [],
        widgets: [],
        input_blocks: [],
        templates: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findPluginByGid(pluginsWithLongGid, longGid);
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe(longGid);
  });
}); 