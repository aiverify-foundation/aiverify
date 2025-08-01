import { findAlgoFromPluginsById } from '../findAlgoFromPluginsById';
import { Plugin, Algorithm } from '@/app/types';

describe('findAlgoFromPluginsById', () => {
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
      algorithms: [
        {
          gid: 'plugin1',
          cid: 'algo1',
          name: 'Algorithm 1',
          modelType: ['classification'],
          version: '1.0.0',
          author: 'Test Author',
          description: 'Test Description',
          tags: ['tag1', 'tag2'],
          requireGroundTruth: true,
          language: 'python',
          script: 'test_script.py',
          module_name: 'test_module',
          inputSchema: {
            title: 'Test Input Schema',
            description: 'Test Description',
            type: 'object',
            required: ['input'],
            properties: {},
          },
          outputSchema: {
            title: 'Test Output Schema',
            description: 'Test Description',
            type: 'object',
            required: ['output'],
            minProperties: 1,
            properties: {
              feature_names: {
                type: 'array',
                description: 'Feature names',
                minItems: 1,
                items: { type: 'string' },
              },
              results: {
                title: 'Results',
                description: 'Test results',
                type: 'array',
                minItems: 1,
                items: {
                  description: 'Result item',
                  type: 'object',
                  required: ['indices'],
                  minProperties: 1,
                  properties: {
                    indices: {
                      title: 'Indices',
                      type: 'array',
                      minItems: 1,
                      items: { type: 'number' },
                    },
                    ale: {
                      title: 'ALE',
                      type: 'array',
                      minItems: 1,
                      items: { type: 'number' },
                    },
                    size: {
                      title: 'Size',
                      type: 'array',
                      minItems: 1,
                      items: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
          zip_hash: 'algo_hash1',
        },
        {
          gid: 'plugin1',
          cid: 'algo2',
          name: 'Algorithm 2',
          modelType: ['regression'],
          version: '1.0.0',
          author: 'Test Author',
          description: 'Test Description',
          tags: ['tag3'],
          requireGroundTruth: false,
          language: 'python',
          script: 'test_script2.py',
          module_name: 'test_module2',
          inputSchema: {
            title: 'Test Input Schema 2',
            description: 'Test Description',
            type: 'object',
            required: ['input'],
            properties: {},
          },
          outputSchema: {
            title: 'Test Output Schema 2',
            description: 'Test Description',
            type: 'object',
            required: ['output'],
            minProperties: 1,
            properties: {
              feature_names: {
                type: 'array',
                description: 'Feature names',
                minItems: 1,
                items: { type: 'string' },
              },
              results: {
                title: 'Results',
                description: 'Test results',
                type: 'array',
                minItems: 1,
                items: {
                  description: 'Result item',
                  type: 'object',
                  required: ['indices'],
                  minProperties: 1,
                  properties: {
                    indices: {
                      title: 'Indices',
                      type: 'array',
                      minItems: 1,
                      items: { type: 'number' },
                    },
                    ale: {
                      title: 'ALE',
                      type: 'array',
                      minItems: 1,
                      items: { type: 'number' },
                    },
                    size: {
                      title: 'Size',
                      type: 'array',
                      minItems: 1,
                      items: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
          zip_hash: 'algo_hash2',
        },
      ],
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
      algorithms: [
        {
          gid: 'plugin2',
          cid: 'algo3',
          name: 'Algorithm 3',
          modelType: ['clustering'],
          version: '2.0.0',
          author: 'Test Author',
          description: 'Test Description',
          tags: ['tag4'],
          requireGroundTruth: true,
          language: 'python',
          script: 'test_script3.py',
          module_name: 'test_module3',
          inputSchema: {
            title: 'Test Input Schema 3',
            description: 'Test Description',
            type: 'object',
            required: ['input'],
            properties: {},
          },
          outputSchema: {
            title: 'Test Output Schema 3',
            description: 'Test Description',
            type: 'object',
            required: ['output'],
            minProperties: 1,
            properties: {
              feature_names: {
                type: 'array',
                description: 'Feature names',
                minItems: 1,
                items: { type: 'string' },
              },
              results: {
                title: 'Results',
                description: 'Test results',
                type: 'array',
                minItems: 1,
                items: {
                  description: 'Result item',
                  type: 'object',
                  required: ['indices'],
                  minProperties: 1,
                  properties: {
                    indices: {
                      title: 'Indices',
                      type: 'array',
                      minItems: 1,
                      items: { type: 'number' },
                    },
                    ale: {
                      title: 'ALE',
                      type: 'array',
                      minItems: 1,
                      items: { type: 'number' },
                    },
                    size: {
                      title: 'Size',
                      type: 'array',
                      minItems: 1,
                      items: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
          zip_hash: 'algo_hash3',
        },
      ],
      widgets: [],
      input_blocks: [],
      templates: [],
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  it('should find an algorithm from plugins by plugin gid and algo cid', () => {
    const result = findAlgoFromPluginsById(
      mockPlugins,
      'plugin1',
      'algo1'
    );
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('plugin1');
    expect(result?.cid).toBe('algo1');
    expect(result?.name).toBe('Algorithm 1');
    expect(result?.version).toBe('1.0.0');
    expect(result?.modelType).toEqual(['classification']);
    expect(result?.requireGroundTruth).toBe(true);
  });

  it('should return undefined when plugin is not found', () => {
    const result = findAlgoFromPluginsById(
      mockPlugins,
      'nonexistent',
      'algo1'
    );
    
    expect(result).toBeUndefined();
  });

  it('should return undefined when algorithm is not found in plugin', () => {
    const result = findAlgoFromPluginsById(
      mockPlugins,
      'plugin1',
      'nonexistent'
    );
    
    expect(result).toBeUndefined();
  });

  it('should return undefined for empty plugins array', () => {
    const result = findAlgoFromPluginsById(
      [],
      'plugin1',
      'algo1'
    );
    
    expect(result).toBeUndefined();
  });

  it('should handle plugin with no algorithms', () => {
    const pluginsWithNoAlgorithms: Plugin[] = [
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
    
    const result = findAlgoFromPluginsById(
      pluginsWithNoAlgorithms,
      'empty-plugin',
      'algo1'
    );
    
    expect(result).toBeUndefined();
  });

  it('should handle case-sensitive matching', () => {
    const result = findAlgoFromPluginsById(
      mockPlugins,
      'PLUGIN1',
      'algo1'
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
        algorithms: [
          {
            gid: '',
            cid: '',
            name: 'Empty Algorithm',
            modelType: ['classification'],
            version: '1.0.0',
            author: 'Test Author',
            description: 'Test Description',
            tags: [],
            requireGroundTruth: true,
            language: 'python',
            script: 'test_script.py',
            module_name: 'test_module',
            inputSchema: {
              title: 'Test Input Schema',
              description: 'Test Description',
              type: 'object',
              required: ['input'],
              properties: {},
            },
            outputSchema: {
              title: 'Test Output Schema',
              description: 'Test Description',
              type: 'object',
              required: ['output'],
              minProperties: 1,
              properties: {
                feature_names: {
                  type: 'array',
                  description: 'Feature names',
                  minItems: 1,
                  items: { type: 'string' },
                },
                results: {
                  title: 'Results',
                  description: 'Test results',
                  type: 'array',
                  minItems: 1,
                  items: {
                    description: 'Result item',
                    type: 'object',
                    required: ['indices'],
                    minProperties: 1,
                    properties: {
                      indices: {
                        title: 'Indices',
                        type: 'array',
                        minItems: 1,
                        items: { type: 'number' },
                      },
                      ale: {
                        title: 'ALE',
                        type: 'array',
                        minItems: 1,
                        items: { type: 'number' },
                      },
                      size: {
                        title: 'Size',
                        type: 'array',
                        minItems: 1,
                        items: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
            zip_hash: 'algo_hash',
          },
        ],
        widgets: [],
        input_blocks: [],
        templates: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findAlgoFromPluginsById(
      pluginsWithEmptyValues,
      '',
      ''
    );
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('');
    expect(result?.cid).toBe('');
    expect(result?.name).toBe('Empty Algorithm');
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
        algorithms: [
          {
            gid: 'plugin-with-dashes',
            cid: 'algo_with_underscores',
            name: 'Special Algorithm',
            modelType: ['classification'],
            version: '1.0.0',
            author: 'Test Author',
            description: 'Test Description',
            tags: [],
            requireGroundTruth: true,
            language: 'python',
            script: 'test_script.py',
            module_name: 'test_module',
            inputSchema: {
              title: 'Test Input Schema',
              description: 'Test Description',
              type: 'object',
              required: ['input'],
              properties: {},
            },
            outputSchema: {
              title: 'Test Output Schema',
              description: 'Test Description',
              type: 'object',
              required: ['output'],
              minProperties: 1,
              properties: {
                feature_names: {
                  type: 'array',
                  description: 'Feature names',
                  minItems: 1,
                  items: { type: 'string' },
                },
                results: {
                  title: 'Results',
                  description: 'Test results',
                  type: 'array',
                  minItems: 1,
                  items: {
                    description: 'Result item',
                    type: 'object',
                    required: ['indices'],
                    minProperties: 1,
                    properties: {
                      indices: {
                        title: 'Indices',
                        type: 'array',
                        minItems: 1,
                        items: { type: 'number' },
                      },
                      ale: {
                        title: 'ALE',
                        type: 'array',
                        minItems: 1,
                        items: { type: 'number' },
                      },
                      size: {
                        title: 'Size',
                        type: 'array',
                        minItems: 1,
                        items: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
            zip_hash: 'algo_hash',
          },
        ],
        widgets: [],
        input_blocks: [],
        templates: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findAlgoFromPluginsById(
      pluginsWithSpecialChars,
      'plugin-with-dashes',
      'algo_with_underscores'
    );
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('plugin-with-dashes');
    expect(result?.cid).toBe('algo_with_underscores');
    expect(result?.name).toBe('Special Algorithm');
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
        algorithms: [
          {
            gid: longString,
            cid: longString,
            name: 'Long Algorithm',
            modelType: ['classification'],
            version: '1.0.0',
            author: 'Test Author',
            description: 'Test Description',
            tags: [],
            requireGroundTruth: true,
            language: 'python',
            script: 'test_script.py',
            module_name: 'test_module',
            inputSchema: {
              title: 'Test Input Schema',
              description: 'Test Description',
              type: 'object',
              required: ['input'],
              properties: {},
            },
            outputSchema: {
              title: 'Test Output Schema',
              description: 'Test Description',
              type: 'object',
              required: ['output'],
              minProperties: 1,
              properties: {
                feature_names: {
                  type: 'array',
                  description: 'Feature names',
                  minItems: 1,
                  items: { type: 'string' },
                },
                results: {
                  title: 'Results',
                  description: 'Test results',
                  type: 'array',
                  minItems: 1,
                  items: {
                    description: 'Result item',
                    type: 'object',
                    required: ['indices'],
                    minProperties: 1,
                    properties: {
                      indices: {
                        title: 'Indices',
                        type: 'array',
                        minItems: 1,
                        items: { type: 'number' },
                      },
                      ale: {
                        title: 'ALE',
                        type: 'array',
                        minItems: 1,
                        items: { type: 'number' },
                      },
                      size: {
                        title: 'Size',
                        type: 'array',
                        minItems: 1,
                        items: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
            zip_hash: 'algo_hash',
          },
        ],
        widgets: [],
        input_blocks: [],
        templates: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findAlgoFromPluginsById(
      pluginsWithLongStrings,
      longString,
      longString
    );
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe(longString);
    expect(result?.cid).toBe(longString);
    expect(result?.name).toBe('Long Algorithm');
  });

  it('should handle algorithms with different model types', () => {
    const result1 = findAlgoFromPluginsById(
      mockPlugins,
      'plugin1',
      'algo1'
    );
    
    const result2 = findAlgoFromPluginsById(
      mockPlugins,
      'plugin1',
      'algo2'
    );
    
    const result3 = findAlgoFromPluginsById(
      mockPlugins,
      'plugin2',
      'algo3'
    );
    
    expect(result1?.modelType).toEqual(['classification']);
    expect(result2?.modelType).toEqual(['regression']);
    expect(result3?.modelType).toEqual(['clustering']);
  });

  it('should handle algorithms with different ground truth requirements', () => {
    const result1 = findAlgoFromPluginsById(
      mockPlugins,
      'plugin1',
      'algo1'
    );
    
    const result2 = findAlgoFromPluginsById(
      mockPlugins,
      'plugin1',
      'algo2'
    );
    
    expect(result1?.requireGroundTruth).toBe(true);
    expect(result2?.requireGroundTruth).toBe(false);
  });

  it('should handle algorithms with different tags', () => {
    const result1 = findAlgoFromPluginsById(
      mockPlugins,
      'plugin1',
      'algo1'
    );
    
    const result2 = findAlgoFromPluginsById(
      mockPlugins,
      'plugin1',
      'algo2'
    );
    
    expect(result1?.tags).toEqual(['tag1', 'tag2']);
    expect(result2?.tags).toEqual(['tag3']);
  });
}); 