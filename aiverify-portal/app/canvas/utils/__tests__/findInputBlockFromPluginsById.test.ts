import { findInputBlockFromPluginsById } from '../findInputBlockFromPluginsById';
import { Plugin, InputBlock } from '@/app/types';

describe('findInputBlockFromPluginsById', () => {
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
      input_blocks: [
        {
          gid: 'plugin1',
          cid: 'input1',
          name: 'Input Block 1',
          description: 'Test Description',
          version: '1.0.0',
          author: 'Test Author',
          tags: null,
        },
        {
          gid: 'plugin1',
          cid: 'input2',
          name: 'Input Block 2',
          description: 'Test Description',
          version: '1.0.0',
          author: 'Test Author',
          tags: null,
        },
      ],
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
      input_blocks: [
        {
          gid: 'plugin2',
          cid: 'input3',
          name: 'Input Block 3',
          description: 'Test Description',
          version: '2.0.0',
          author: 'Test Author',
          tags: null,
        },
      ],
      templates: [],
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  it('should find an input block from a plugin by gid and cid', () => {
    const result = findInputBlockFromPluginsById(
      mockPlugins,
      'plugin1',
      'input1'
    );
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('plugin1');
    expect(result?.cid).toBe('input1');
    expect(result?.name).toBe('Input Block 1');
    expect(result?.version).toBe('1.0.0');
  });

  it('should return undefined when plugin is not found', () => {
    const result = findInputBlockFromPluginsById(
      mockPlugins,
      'nonexistent',
      'input1'
    );
    
    expect(result).toBeUndefined();
  });

  it('should return undefined when input block is not found in plugin', () => {
    const result = findInputBlockFromPluginsById(
      mockPlugins,
      'plugin1',
      'nonexistent'
    );
    
    expect(result).toBeUndefined();
  });

  it('should return undefined for empty plugins array', () => {
    const result = findInputBlockFromPluginsById(
      [],
      'plugin1',
      'input1'
    );
    
    expect(result).toBeUndefined();
  });

  it('should handle plugin with no input blocks', () => {
    const pluginsWithNoInputBlocks: Plugin[] = [
      {
        gid: 'empty-plugin',
        version: '1.0.0',
        name: 'Empty Plugin',
        author: 'Test Author',
        description: 'Test Description',
        url: 'https://example.com/empty',
        meta: '{"key": "value"}',
        is_stock: true,
        zip_hash: 'hash',
        algorithms: [],
        widgets: [],
        input_blocks: [],
        templates: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findInputBlockFromPluginsById(
      pluginsWithNoInputBlocks,
      'empty-plugin',
      'input1'
    );
    
    expect(result).toBeUndefined();
  });

  it('should handle case-sensitive matching', () => {
    const result = findInputBlockFromPluginsById(
      mockPlugins,
      'PLUGIN1',
      'input1'
    );
    
    expect(result).toBeUndefined(); // Should not find due to case sensitivity
  });

  it('should handle empty string parameters', () => {
    const pluginsWithEmptyValues: Plugin[] = [
      {
        gid: '',
        version: '1.0.0',
        name: 'Empty Plugin',
        author: 'Test Author',
        description: 'Test Description',
        url: 'https://example.com/empty',
        meta: '{"key": "value"}',
        is_stock: true,
        zip_hash: 'hash',
        algorithms: [],
        widgets: [],
        input_blocks: [
          {
            gid: '',
            cid: '',
            name: 'Empty Input Block',
            description: 'Test Description',
            version: '1.0.0',
            author: 'Test Author',
            tags: null,
          },
        ],
        templates: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findInputBlockFromPluginsById(
      pluginsWithEmptyValues,
      '',
      ''
    );
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('');
    expect(result?.cid).toBe('');
    expect(result?.name).toBe('Empty Input Block');
  });

  it('should handle special characters in parameters', () => {
    const pluginsWithSpecialChars: Plugin[] = [
      {
        gid: 'plugin-with-dashes',
        version: '1.0.0',
        name: 'Special Plugin',
        author: 'Test Author',
        description: 'Test Description',
        url: 'https://example.com/special',
        meta: '{"key": "value"}',
        is_stock: true,
        zip_hash: 'hash',
        algorithms: [],
        widgets: [],
        input_blocks: [
          {
            gid: 'plugin-with-dashes',
            cid: 'input_with_underscores',
            name: 'Special Input Block',
            description: 'Test Description',
            version: '1.0.0',
            author: 'Test Author',
            tags: null,
          },
        ],
        templates: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findInputBlockFromPluginsById(
      pluginsWithSpecialChars,
      'plugin-with-dashes',
      'input_with_underscores'
    );
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('plugin-with-dashes');
    expect(result?.cid).toBe('input_with_underscores');
    expect(result?.name).toBe('Special Input Block');
  });

  it('should handle very long string parameters', () => {
    const longString = 'a'.repeat(1000);
    const pluginsWithLongStrings: Plugin[] = [
      {
        gid: longString,
        version: '1.0.0',
        name: 'Long Plugin',
        author: 'Test Author',
        description: 'Test Description',
        url: 'https://example.com/long',
        meta: '{"key": "value"}',
        is_stock: true,
        zip_hash: 'hash',
        algorithms: [],
        widgets: [],
        input_blocks: [
          {
            gid: longString,
            cid: longString,
            name: 'Long Input Block',
            description: 'Test Description',
            version: '1.0.0',
            author: 'Test Author',
            tags: null,
          },
        ],
        templates: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findInputBlockFromPluginsById(
      pluginsWithLongStrings,
      longString,
      longString
    );
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe(longString);
    expect(result?.cid).toBe(longString);
    expect(result?.name).toBe('Long Input Block');
  });

  it('should handle input blocks with null values', () => {
    const pluginsWithNullValues: Plugin[] = [
      {
        gid: 'plugin1',
        version: '1.0.0',
        name: 'Test Plugin',
        author: null,
        description: null,
        url: null,
        meta: '{"key": "value"}',
        is_stock: true,
        zip_hash: 'hash',
        algorithms: [],
        widgets: [],
        input_blocks: [
          {
            gid: 'plugin1',
            cid: 'input1',
            name: 'Input Block',
            description: 'Test Description',
            version: '1.0.0',
            author: null,
            tags: null,
          },
        ],
        templates: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findInputBlockFromPluginsById(
      pluginsWithNullValues,
      'plugin1',
      'input1'
    );
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('plugin1');
    expect(result?.cid).toBe('input1');
    expect(result?.author).toBeNull();
  });
}); 