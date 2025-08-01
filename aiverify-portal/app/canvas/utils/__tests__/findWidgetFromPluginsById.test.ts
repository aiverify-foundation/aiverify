import { findWidgetFromPluginsById } from '../findWidgetFromPluginsById';
import { PluginForGridLayout, WidgetOnGridLayout } from '@/app/canvas/types';

describe('findWidgetFromPluginsById', () => {
  const mockPlugins: PluginForGridLayout[] = [
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
      input_blocks: [],
      templates: [],
      widgets: [
        {
          gid: 'plugin1',
          cid: 'widget1',
          name: 'Widget 1',
          version: '1.0.0',
          author: 'Test Author',
          description: 'Test Description',
          widgetSize: {
            minW: 1,
            minH: 1,
            maxW: 12,
            maxH: 12,
          },
          properties: null,
          tags: null,
          dependencies: [],
          mockdata: null,
          dynamicHeight: false,
          mdx: {
            code: 'test code 1',
            frontmatter: { title: 'Widget 1' },
          },
          gridItemId: 'grid1',
          result: {},
        },
        {
          gid: 'plugin1',
          cid: 'widget2',
          name: 'Widget 2',
          version: '1.0.0',
          author: 'Test Author',
          description: 'Test Description',
          widgetSize: {
            minW: 2,
            minH: 2,
            maxW: 12,
            maxH: 12,
          },
          properties: null,
          tags: null,
          dependencies: [],
          mockdata: null,
          dynamicHeight: true,
          mdx: {
            code: 'test code 2',
            frontmatter: { title: 'Widget 2' },
          },
          gridItemId: 'grid2',
          result: {},
        },
      ],
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
      input_blocks: [],
      templates: [],
      widgets: [
        {
          gid: 'plugin2',
          cid: 'widget3',
          name: 'Widget 3',
          version: '2.0.0',
          author: 'Test Author',
          description: 'Test Description',
          widgetSize: {
            minW: 3,
            minH: 3,
            maxW: 12,
            maxH: 12,
          },
          properties: null,
          tags: null,
          dependencies: [],
          mockdata: null,
          dynamicHeight: false,
          mdx: {
            code: 'test code 3',
            frontmatter: { title: 'Widget 3' },
          },
          gridItemId: 'grid3',
          result: {},
        },
      ],
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  it('should find a widget from plugins by plugin id and widget id', () => {
    const result = findWidgetFromPluginsById(
      mockPlugins,
      'plugin1',
      'widget1'
    );
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('plugin1');
    expect(result?.cid).toBe('widget1');
    expect(result?.name).toBe('Widget 1');
    expect(result?.version).toBe('1.0.0');
    expect(result?.widgetSize).toEqual({
      minW: 1,
      minH: 1,
      maxW: 12,
      maxH: 12,
    });
  });

  it('should return undefined when plugin is not found', () => {
    const result = findWidgetFromPluginsById(
      mockPlugins,
      'nonexistent',
      'widget1'
    );
    
    expect(result).toBeUndefined();
  });

  it('should return undefined when widget is not found in plugin', () => {
    const result = findWidgetFromPluginsById(
      mockPlugins,
      'plugin1',
      'nonexistent'
    );
    
    expect(result).toBeUndefined();
  });

  it('should return undefined for empty plugins array', () => {
    const result = findWidgetFromPluginsById(
      [],
      'plugin1',
      'widget1'
    );
    
    expect(result).toBeUndefined();
  });

  it('should handle plugin with no widgets', () => {
    const pluginsWithNoWidgets: PluginForGridLayout[] = [
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
        input_blocks: [],
        templates: [],
        widgets: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findWidgetFromPluginsById(
      pluginsWithNoWidgets,
      'empty-plugin',
      'widget1'
    );
    
    expect(result).toBeUndefined();
  });

  it('should handle case-sensitive matching', () => {
    const result = findWidgetFromPluginsById(
      mockPlugins,
      'PLUGIN1',
      'widget1'
    );
    
    expect(result).toBeUndefined(); // Should not find due to case sensitivity
  });

  it('should handle empty string parameters', () => {
    const pluginsWithEmptyValues: PluginForGridLayout[] = [
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
        input_blocks: [],
        templates: [],
        widgets: [
          {
            gid: '',
            cid: '',
            name: 'Empty Widget',
            version: '1.0.0',
            author: 'Test Author',
            description: 'Test Description',
            widgetSize: {
              minW: 1,
              minH: 1,
              maxW: 12,
              maxH: 12,
            },
            properties: null,
            tags: null,
            dependencies: [],
            mockdata: null,
            dynamicHeight: false,
            mdx: {
              code: 'test code',
              frontmatter: { title: 'Empty Widget' },
            },
            gridItemId: 'grid1',
            result: {},
          },
        ],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findWidgetFromPluginsById(
      pluginsWithEmptyValues,
      '',
      ''
    );
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('');
    expect(result?.cid).toBe('');
    expect(result?.name).toBe('Empty Widget');
  });

  it('should handle special characters in parameters', () => {
    const pluginsWithSpecialChars: PluginForGridLayout[] = [
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
        input_blocks: [],
        templates: [],
        widgets: [
          {
            gid: 'plugin-with-dashes',
            cid: 'widget_with_underscores',
            name: 'Special Widget',
            version: '1.0.0',
            author: 'Test Author',
            description: 'Test Description',
            widgetSize: {
              minW: 1,
              minH: 1,
              maxW: 12,
              maxH: 12,
            },
            properties: null,
            tags: null,
            dependencies: [],
            mockdata: null,
            dynamicHeight: false,
            mdx: {
              code: 'test code',
              frontmatter: { title: 'Special Widget' },
            },
            gridItemId: 'grid1',
            result: {},
          },
        ],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findWidgetFromPluginsById(
      pluginsWithSpecialChars,
      'plugin-with-dashes',
      'widget_with_underscores'
    );
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('plugin-with-dashes');
    expect(result?.cid).toBe('widget_with_underscores');
    expect(result?.name).toBe('Special Widget');
  });

  it('should handle very long string parameters', () => {
    const longString = 'a'.repeat(1000);
    const pluginsWithLongStrings: PluginForGridLayout[] = [
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
        input_blocks: [],
        templates: [],
        widgets: [
          {
            gid: longString,
            cid: longString,
            name: 'Long Widget',
            version: '1.0.0',
            author: 'Test Author',
            description: 'Test Description',
            widgetSize: {
              minW: 1,
              minH: 1,
              maxW: 12,
              maxH: 12,
            },
            properties: null,
            tags: null,
            dependencies: [],
            mockdata: null,
            dynamicHeight: false,
            mdx: {
              code: 'test code',
              frontmatter: { title: 'Long Widget' },
            },
            gridItemId: 'grid1',
            result: {},
          },
        ],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findWidgetFromPluginsById(
      pluginsWithLongStrings,
      longString,
      longString
    );
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe(longString);
    expect(result?.cid).toBe(longString);
    expect(result?.name).toBe('Long Widget');
  });

  it('should handle widgets with null values', () => {
    const pluginsWithNullValues: PluginForGridLayout[] = [
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
        input_blocks: [],
        templates: [],
        widgets: [
          {
            gid: 'plugin1',
            cid: 'widget1',
            name: 'Widget with Null Values',
            version: null,
            author: null,
            description: null,
            widgetSize: {
              minW: 1,
              minH: 1,
              maxW: 12,
              maxH: 12,
            },
            properties: null,
            tags: null,
            dependencies: [],
            mockdata: null,
            dynamicHeight: false,
            mdx: {
              code: 'test code',
              frontmatter: { title: 'Widget with Null Values' },
            },
            gridItemId: 'grid1',
            result: {},
          },
        ],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    ];
    
    const result = findWidgetFromPluginsById(
      pluginsWithNullValues,
      'plugin1',
      'widget1'
    );
    
    expect(result).toBeDefined();
    expect(result?.gid).toBe('plugin1');
    expect(result?.cid).toBe('widget1');
    expect(result?.author).toBeNull();
    expect(result?.description).toBeNull();
  });

  it('should handle widgets with dynamic height', () => {
    const result = findWidgetFromPluginsById(
      mockPlugins,
      'plugin1',
      'widget2'
    );
    
    expect(result).toBeDefined();
    expect(result?.dynamicHeight).toBe(true);
    expect(result?.widgetSize).toEqual({
      minW: 2,
      minH: 2,
      maxW: 12,
      maxH: 12,
    });
  });
}); 