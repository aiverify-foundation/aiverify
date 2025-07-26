import { populateInitialWidgetResult } from '../populateInitialWidgetResult';
import { WidgetOnGridLayout } from '@/app/canvas/types';

describe('populateInitialWidgetResult', () => {
  it('should populate initial widget result with dependencies', () => {
    const mockWidget: WidgetOnGridLayout = {
      gid: 'plugin1',
      cid: 'widget1',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test Description',
      widgetSize: { minW: 1, minH: 1, maxW: 12, maxH: 12 },
      properties: [],
      tags: null,
      dependencies: [
        { gid: 'plugin2', cid: 'algo1', version: '1.0.0' },
        { gid: 'plugin3', cid: 'algo2', version: '2.0.0' },
      ],
      mockdata: null,
      dynamicHeight: false,
      mdx: { code: '', frontmatter: undefined },
      gridItemId: 'widget1',
    };

    const result = populateInitialWidgetResult(mockWidget);

    expect(result).toBeDefined();
    expect(result.gid).toBe('plugin1');
    expect(result.cid).toBe('widget1');
    expect(result.name).toBe('Test Widget');
    expect(result.result).toEqual({
      'plugin1:algo1': null,
      'plugin1:algo2': null,
    });
  });

  it('should handle widget with no dependencies', () => {
    const mockWidget: WidgetOnGridLayout = {
      gid: 'plugin1',
      cid: 'widget1',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test Description',
      widgetSize: { minW: 1, minH: 1, maxW: 12, maxH: 12 },
      properties: [],
      tags: null,
      dependencies: [],
      mockdata: null,
      dynamicHeight: false,
      mdx: { code: '', frontmatter: undefined },
      gridItemId: 'widget1',
    };

    const result = populateInitialWidgetResult(mockWidget);

    expect(result).toBeDefined();
    expect(result.gid).toBe('plugin1');
    expect(result.cid).toBe('widget1');
    expect(result.result).toEqual({});
  });

  it('should handle widget with null dependencies', () => {
    const mockWidget: WidgetOnGridLayout = {
      gid: 'plugin1',
      cid: 'widget1',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test Description',
      widgetSize: { minW: 1, minH: 1, maxW: 12, maxH: 12 },
      properties: [],
      tags: null,
      dependencies: [
        { gid: null, cid: 'algo1', version: '1.0.0' },
        { gid: 'plugin3', cid: 'algo2', version: '2.0.0' },
      ],
      mockdata: null,
      dynamicHeight: false,
      mdx: { code: '', frontmatter: undefined },
      gridItemId: 'widget1',
    };

    const result = populateInitialWidgetResult(mockWidget);

    expect(result).toBeDefined();
    expect(result.result).toEqual({
      'plugin1:algo1': null,
      'plugin1:algo2': null,
    });
  });

  it('should handle widget with null version dependencies', () => {
    const mockWidget: WidgetOnGridLayout = {
      gid: 'plugin1',
      cid: 'widget1',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test Description',
      widgetSize: { minW: 1, minH: 1, maxW: 12, maxH: 12 },
      properties: [],
      tags: null,
      dependencies: [
        { gid: 'plugin2', cid: 'algo1', version: null },
        { gid: 'plugin3', cid: 'algo2', version: '2.0.0' },
      ],
      mockdata: null,
      dynamicHeight: false,
      mdx: { code: '', frontmatter: undefined },
      gridItemId: 'widget1',
    };

    const result = populateInitialWidgetResult(mockWidget);

    expect(result).toBeDefined();
    expect(result.result).toEqual({
      'plugin1:algo1': null,
      'plugin1:algo2': null,
    });
  });

  it('should preserve all widget properties', () => {
    const mockWidget: WidgetOnGridLayout = {
      gid: 'plugin1',
      cid: 'widget1',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test Description',
      widgetSize: { minW: 1, minH: 1, maxW: 12, maxH: 12 },
      properties: [
        { key: 'prop1', helper: 'Help text', default: 'default1' },
        { key: 'prop2', helper: 'Help text 2', default: 'default2' },
      ],
      tags: 'tag1,tag2',
      dependencies: [
        { gid: 'plugin2', cid: 'algo1', version: '1.0.0' },
      ],
      mockdata: [
        {
          type: 'Algorithm',
          gid: 'plugin2',
          cid: 'algo1',
          data: { test: 'data' },
        },
      ],
      dynamicHeight: true,
      mdx: { code: 'const Component = () => <div>Test</div>', frontmatter: { title: 'Test' } },
      gridItemId: 'widget1',
    };

    const result = populateInitialWidgetResult(mockWidget);

    expect(result).toBeDefined();
    expect(result.gid).toBe('plugin1');
    expect(result.cid).toBe('widget1');
    expect(result.name).toBe('Test Widget');
    expect(result.version).toBe('1.0.0');
    expect(result.author).toBe('Test Author');
    expect(result.description).toBe('Test Description');
    expect(result.widgetSize).toEqual({ minW: 1, minH: 1, maxW: 12, maxH: 12 });
    expect(result.properties).toHaveLength(2);
    expect(result.tags).toBe('tag1,tag2');
    expect(result.dependencies).toHaveLength(1);
    expect(result.mockdata).toHaveLength(1);
    expect(result.dynamicHeight).toBe(true);
    expect(result.mdx).toEqual({ code: 'const Component = () => <div>Test</div>', frontmatter: { title: 'Test' } });
    expect(result.gridItemId).toBe('widget1');
    expect(result.result).toEqual({
      'plugin1:algo1': null,
    });
  });

  it('should handle widget with existing result property', () => {
    const mockWidget: WidgetOnGridLayout = {
      gid: 'plugin1',
      cid: 'widget1',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test Description',
      widgetSize: { minW: 1, minH: 1, maxW: 12, maxH: 12 },
      properties: [],
      tags: null,
      dependencies: [
        { gid: 'plugin2', cid: 'algo1', version: '1.0.0' },
      ],
      mockdata: null,
      dynamicHeight: false,
      mdx: { code: '', frontmatter: undefined },
      gridItemId: 'widget1',
      result: { existing: 'data' } as any,
    };

    const result = populateInitialWidgetResult(mockWidget);

    expect(result).toBeDefined();
    expect(result.result).toEqual({
      'plugin1:algo1': null,
    });
    // The existing result should be overwritten
    expect(result.result).not.toHaveProperty('existing');
  });

  it('should handle widget with complex dependency structure', () => {
    const mockWidget: WidgetOnGridLayout = {
      gid: 'complex-plugin',
      cid: 'complex-widget',
      name: 'Complex Widget',
      version: '2.0.0',
      author: 'Complex Author',
      description: 'Complex Description',
      widgetSize: { minW: 2, minH: 2, maxW: 24, maxH: 24 },
      properties: [],
      tags: null,
      dependencies: [
        { gid: 'algo-plugin-1', cid: 'classification-algo', version: '1.0.0' },
        { gid: 'algo-plugin-2', cid: 'regression-algo', version: '2.0.0' },
        { gid: 'algo-plugin-3', cid: 'clustering-algo', version: '3.0.0' },
        { gid: null, cid: 'null-gid-algo', version: '1.0.0' },
        { gid: 'algo-plugin-4', cid: 'null-version-algo', version: null },
      ],
      mockdata: null,
      dynamicHeight: false,
      mdx: { code: '', frontmatter: undefined },
      gridItemId: 'complex-widget',
    };

    const result = populateInitialWidgetResult(mockWidget);

    expect(result).toBeDefined();
    expect(result.gid).toBe('complex-plugin');
    expect(result.cid).toBe('complex-widget');
    expect(result.result).toEqual({
      'complex-plugin:classification-algo': null,
      'complex-plugin:regression-algo': null,
      'complex-plugin:clustering-algo': null,
      'complex-plugin:null-gid-algo': null,
      'complex-plugin:null-version-algo': null,
    });
  });
}); 