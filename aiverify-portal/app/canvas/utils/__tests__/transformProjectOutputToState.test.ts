import { transformProjectOutputToState, ProjectOutput } from '../transformProjectOutputToState';
import { PluginForGridLayout } from '@/app/canvas/types';
import { Algorithm, InputBlock } from '@/app/types';

// Mock the utility functions
jest.mock('../findWidgetFromPluginsById', () => ({
  findWidgetFromPluginsById: jest.fn(),
}));

jest.mock('../getWidgetAlgosFromPlugins', () => ({
  getWidgetAlgosFromPlugins: jest.fn(),
}));

jest.mock('../getWidgetInputBlocksFromPlugins', () => ({
  getWidgetInputBlocksFromPlugins: jest.fn(),
}));

describe('transformProjectOutputToState', () => {
  const mockPluginWidget = {
    cid: 'widget1',
    name: 'Test Widget',
    version: '1.0.0',
    author: 'Test Author',
    description: 'Test widget description',
    widgetSize: {
      minW: 2,
      minH: 2,
      maxW: 12,
      maxH: 12,
    },
    properties: [],
    tags: 'test,widget',
    dependencies: [],
    mockdata: [],
    dynamicHeight: false,
    gid: 'plugin1',
    mdx: {
      code: 'test mdx code',
      frontmatter: {},
    },
    gridItemId: 'widget1',
  };

  const mockPlugin: PluginForGridLayout = {
    gid: 'plugin1',
    version: '1.0.0',
    name: 'Test Plugin',
    author: 'Test Author',
    description: 'Test plugin description',
    url: 'https://test.com',
    meta: 'test meta',
    is_stock: true,
    zip_hash: 'test-hash',
    algorithms: [],
    widgets: [mockPluginWidget],
    input_blocks: [],
    templates: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockProject: ProjectOutput = {
    id: 1,
    templateId: 'template-1',
    pages: [
      {
        layouts: [
          {
            i: 'widget1',
            x: 0,
            y: 0,
            w: 6,
            h: 4,
            maxW: 12,
            maxH: 12,
            minW: 2,
            minH: 2,
            static: false,
            isDraggable: true,
            isResizable: true,
            resizeHandles: ['se'],
            isBounded: true,
          },
        ],
        reportWidgets: [
          {
            widgetGID: 'plugin1:widget1',
            key: 'widget1',
            layoutItemProperties: {
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              textAlign: 'left',
              color: null,
              bgcolor: null,
            },
            properties: {
              prop1: 'value1',
              prop2: 'value2',
            },
            name: 'Test Widget',
            version: '1.0.0',
            author: 'Test Author',
            description: 'Test widget description',
            widgetSize: {
              minW: 2,
              minH: 2,
              maxW: 12,
              maxH: 12,
            },
            tags: ['test', 'widget'],
            dependencies: [
              {
                gid: 'dep-plugin',
                cid: 'dep-widget',
                version: '1.0.0',
              },
            ],
            mockdata: [
              {
                type: 'Algorithm' as const,
                gid: 'algo-plugin',
                cid: 'algo1',
                data: { test: 'data' },
                artifacts: ['artifact1'],
              },
            ],
            dynamicHeight: false,
          },
        ],
      },
    ],
    globalVars: [
      { key: 'var1', value: 'value1' },
    ],
    projectInfo: {
      name: 'Test Project',
      description: 'Test project description',
      reportTitle: 'Test Report',
      company: 'Test Company',
    },
    testModelId: 1,
    inputBlocks: [
      { id: 1, gid: 'input-plugin', cid: 'input1' },
    ],
    testResults: [
      { id: 1, gid: 'algo-plugin', cid: 'algo1' },
    ],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { findWidgetFromPluginsById } = require('../findWidgetFromPluginsById');
    const { getWidgetAlgosFromPlugins } = require('../getWidgetAlgosFromPlugins');
    const { getWidgetInputBlocksFromPlugins } = require('../getWidgetInputBlocksFromPlugins');

    findWidgetFromPluginsById.mockReturnValue(mockPluginWidget);
    getWidgetAlgosFromPlugins.mockReturnValue([]);
    getWidgetInputBlocksFromPlugins.mockReturnValue([]);
  });

  describe('with empty project', () => {
    it('should return default initial state when project has no pages', () => {
      const emptyProject: ProjectOutput = {
        ...mockProject,
        pages: [],
      };

      const result = transformProjectOutputToState(emptyProject, [mockPlugin]);

      expect(result).toEqual({
        layouts: [[]],
        widgets: [[]],
        algorithmsOnReport: [],
        inputBlocksOnReport: [],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
        currentPage: 0,
        showGrid: true,
        pageTypes: ['grid'],
        overflowParents: [null],
      });
    });

    it('should return default initial state when project pages is null', () => {
      const nullPagesProject: ProjectOutput = {
        ...mockProject,
        pages: null as any,
      };

      const result = transformProjectOutputToState(nullPagesProject, [mockPlugin]);

      expect(result).toEqual({
        layouts: [[]],
        widgets: [[]],
        algorithmsOnReport: [],
        inputBlocksOnReport: [],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
        currentPage: 0,
        showGrid: true,
        pageTypes: ['grid'],
        overflowParents: [null],
      });
    });
  });

  describe('with valid project', () => {
    it('should transform project with single page correctly', () => {
      const result = transformProjectOutputToState(mockProject, [mockPlugin]);

      expect(result.layouts).toHaveLength(1);
      expect(result.widgets).toHaveLength(1);
      expect(result.pageTypes).toEqual(['grid']);
      expect(result.overflowParents).toEqual([null]);
      expect(result.currentPage).toBe(0);
      expect(result.showGrid).toBe(true);
    });

    it('should transform project with multiple pages correctly', () => {
      const multiPageProject: ProjectOutput = {
        ...mockProject,
        pages: [
          mockProject.pages[0],
          {
            layouts: [
              {
                i: 'widget2',
                x: 0,
                y: 0,
                w: 6,
                h: 4,
                maxW: 12,
                maxH: 12,
                minW: 2,
                minH: 2,
                static: false,
                isDraggable: true,
                isResizable: true,
                resizeHandles: ['se'],
                isBounded: true,
              },
            ],
            reportWidgets: [
              {
                widgetGID: 'plugin1:widget2',
                key: 'widget2',
                layoutItemProperties: {
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  color: null,
                  bgcolor: null,
                },
                properties: null,
                name: 'Test Widget 2',
                version: '1.0.0',
                author: 'Test Author',
                description: 'Test widget description',
                widgetSize: {
                  minW: 2,
                  minH: 2,
                  maxW: 12,
                  maxH: 12,
                },
                tags: ['test', 'widget'],
                dependencies: [],
                mockdata: null,
                dynamicHeight: false,
              },
            ],
          },
        ],
      };

      const result = transformProjectOutputToState(multiPageProject, [mockPlugin]);

      expect(result.layouts).toHaveLength(2);
      expect(result.widgets).toHaveLength(2);
      expect(result.pageTypes).toEqual(['grid', 'grid']);
      expect(result.overflowParents).toEqual([null, null]);
    });

    it('should handle widgets with missing plugin definitions', () => {
      const { findWidgetFromPluginsById } = require('../findWidgetFromPluginsById');
      findWidgetFromPluginsById.mockReturnValue(null);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = transformProjectOutputToState(mockProject, [mockPlugin]);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Widget not found - gid: plugin1 - cid: widget1'
      );
      expect(result.widgets[0]).toHaveLength(0); // Widget should be filtered out

      consoleSpy.mockRestore();
    });

    it('should transform widget properties correctly', () => {
      const result = transformProjectOutputToState(mockProject, [mockPlugin]);

      const transformedWidget = result.widgets[0][0];
      expect(transformedWidget.properties).toEqual([
        { key: 'prop1', helper: '', default: 'value1', value: 'value1' },
        { key: 'prop2', helper: '', default: 'value2', value: 'value2' },
      ]);
    });

    it('should handle widgets with null properties', () => {
      const projectWithNullProperties: ProjectOutput = {
        ...mockProject,
        pages: [
          {
            ...mockProject.pages[0],
            reportWidgets: [
              {
                ...mockProject.pages[0].reportWidgets[0],
                properties: null,
              },
            ],
          },
        ],
      };

      const result = transformProjectOutputToState(projectWithNullProperties, [mockPlugin]);

      const transformedWidget = result.widgets[0][0];
      expect(transformedWidget.properties).toBeNull();
    });

    it('should use plugin data as fallback when project data is missing', () => {
      const projectWithMissingData: ProjectOutput = {
        ...mockProject,
        pages: [
          {
            ...mockProject.pages[0],
            reportWidgets: [
              {
                widgetGID: 'plugin1:widget1',
                key: 'widget1',
                layoutItemProperties: null,
                properties: null,
                // Missing name, version, author, description, etc.
              },
            ],
          },
        ],
      };

      const result = transformProjectOutputToState(projectWithMissingData, [mockPlugin]);

      const transformedWidget = result.widgets[0][0];
      expect(transformedWidget.name).toBe('Test Widget');
      expect(transformedWidget.version).toBe('1.0.0');
      expect(transformedWidget.author).toBe('Test Author');
      expect(transformedWidget.description).toBe('Test widget description');
    });

    it('should handle algorithms and input blocks mapping', () => {
      const mockAlgorithm: Algorithm = {
        cid: 'algo1',
        gid: 'algo-plugin',
        name: 'Test Algorithm',
        modelType: ['test'],
        version: '1.0.0',
        author: 'Test Author',
        description: 'Test algorithm description',
        tags: ['test'],
        requireGroundTruth: false,
        language: 'python',
        script: 'test script',
        module_name: 'test_module',
        inputSchema: {
          title: 'Test Input',
          description: 'Test input description',
          type: 'object',
          required: [],
          properties: {},
        },
        outputSchema: {
          title: 'Test Output',
          description: 'Test output description',
          type: 'object',
          required: [],
          minProperties: 0,
          properties: {
            feature_names: {
              type: 'array',
              description: 'Feature names',
              minItems: 0,
              items: {
                type: 'string',
              },
            },
            results: {
              title: 'Results',
              description: 'Algorithm results',
              type: 'array',
              minItems: 0,
              items: {
                description: 'Result item',
                type: 'object',
                required: [],
                minProperties: 0,
                properties: {
                  indices: {
                    title: 'Indices',
                    type: 'array',
                    minItems: 0,
                    items: {
                      type: 'number',
                    },
                  },
                  ale: {
                    title: 'ALE',
                    type: 'array',
                    minItems: 0,
                    items: {
                      type: 'number',
                    },
                  },
                  size: {
                    title: 'Size',
                    type: 'array',
                    minItems: 0,
                    items: {
                      type: 'number',
                    },
                  },
                },
              },
            },
          },
        },
        zip_hash: 'test-hash',
      };

      const mockInputBlock: InputBlock = {
        gid: 'input-plugin',
        cid: 'input1',
        name: 'Test Input Block',
        description: 'Test input block description',
        group: 'test-group',
        width: '100%',
        version: '1.0.0',
        author: 'Test Author',
        tags: 'test',
        groupNumber: 1,
        fullScreen: false,
      };

      const { getWidgetAlgosFromPlugins } = require('../getWidgetAlgosFromPlugins');
      const { getWidgetInputBlocksFromPlugins } = require('../getWidgetInputBlocksFromPlugins');

      getWidgetAlgosFromPlugins.mockReturnValue([mockAlgorithm]);
      getWidgetInputBlocksFromPlugins.mockReturnValue([mockInputBlock]);

      const result = transformProjectOutputToState(mockProject, [mockPlugin]);

      expect(result.algorithmsOnReport).toHaveLength(1);
      expect(result.algorithmsOnReport[0]).toEqual(mockAlgorithm);
      expect(result.inputBlocksOnReport).toHaveLength(1);
      expect(result.inputBlocksOnReport[0]).toEqual(mockInputBlock);
      expect(result.gridItemToAlgosMap['widget1']).toHaveLength(1);
      expect(result.gridItemToInputBlockDatasMap['widget1']).toHaveLength(1);
    });

    it('should handle test result ID mapping', () => {
      const mockAlgorithm: Algorithm = {
        cid: 'algo1',
        gid: 'algo-plugin',
        name: 'Test Algorithm',
        modelType: ['test'],
        version: '1.0.0',
        author: 'Test Author',
        description: 'Test algorithm description',
        tags: ['test'],
        requireGroundTruth: false,
        language: 'python',
        script: 'test script',
        module_name: 'test_module',
        inputSchema: {
          title: 'Test Input',
          description: 'Test input description',
          type: 'object',
          required: [],
          properties: {},
        },
        outputSchema: {
          title: 'Test Output',
          description: 'Test output description',
          type: 'object',
          required: [],
          minProperties: 0,
          properties: {
            feature_names: {
              type: 'array',
              description: 'Feature names',
              minItems: 0,
              items: {
                type: 'string',
              },
            },
            results: {
              title: 'Results',
              description: 'Algorithm results',
              type: 'array',
              minItems: 0,
              items: {
                description: 'Result item',
                type: 'object',
                required: [],
                minProperties: 0,
                properties: {
                  indices: {
                    title: 'Indices',
                    type: 'array',
                    minItems: 0,
                    items: {
                      type: 'number',
                    },
                  },
                  ale: {
                    title: 'ALE',
                    type: 'array',
                    minItems: 0,
                    items: {
                      type: 'number',
                    },
                  },
                  size: {
                    title: 'Size',
                    type: 'array',
                    minItems: 0,
                    items: {
                      type: 'number',
                    },
                  },
                },
              },
            },
          },
        },
        zip_hash: 'test-hash',
      };

      const { getWidgetAlgosFromPlugins } = require('../getWidgetAlgosFromPlugins');
      getWidgetAlgosFromPlugins.mockReturnValue([mockAlgorithm]);

      const result = transformProjectOutputToState(mockProject, [mockPlugin]);

      expect(result.gridItemToAlgosMap['widget1'][0]).toEqual({
        gid: 'algo-plugin',
        cid: 'algo1',
        testResultId: 1,
      });
    });

    it('should handle errors during widget processing gracefully', () => {
      const { getWidgetAlgosFromPlugins } = require('../getWidgetAlgosFromPlugins');
      getWidgetAlgosFromPlugins.mockImplementation(() => {
        throw new Error('Test error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = transformProjectOutputToState(mockProject, [mockPlugin]);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error processing widget:',
        expect.any(Object),
        expect.any(Error)
      );
      expect(result.algorithmsOnReport).toHaveLength(0);
      expect(result.inputBlocksOnReport).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it('should avoid duplicate algorithms in algorithmsOnReport', () => {
      const mockAlgorithm: Algorithm = {
        cid: 'algo1',
        gid: 'algo-plugin',
        name: 'Test Algorithm',
        modelType: ['test'],
        version: '1.0.0',
        author: 'Test Author',
        description: 'Test algorithm description',
        tags: ['test'],
        requireGroundTruth: false,
        language: 'python',
        script: 'test script',
        module_name: 'test_module',
        inputSchema: {
          title: 'Test Input',
          description: 'Test input description',
          type: 'object',
          required: [],
          properties: {},
        },
        outputSchema: {
          title: 'Test Output',
          description: 'Test output description',
          type: 'object',
          required: [],
          minProperties: 0,
          properties: {
            feature_names: {
              type: 'array',
              description: 'Feature names',
              minItems: 0,
              items: {
                type: 'string',
              },
            },
            results: {
              title: 'Results',
              description: 'Algorithm results',
              type: 'array',
              minItems: 0,
              items: {
                description: 'Result item',
                type: 'object',
                required: [],
                minProperties: 0,
                properties: {
                  indices: {
                    title: 'Indices',
                    type: 'array',
                    minItems: 0,
                    items: {
                      type: 'number',
                    },
                  },
                  ale: {
                    title: 'ALE',
                    type: 'array',
                    minItems: 0,
                    items: {
                      type: 'number',
                    },
                  },
                  size: {
                    title: 'Size',
                    type: 'array',
                    minItems: 0,
                    items: {
                      type: 'number',
                    },
                  },
                },
              },
            },
          },
        },
        zip_hash: 'test-hash',
      };

      const { getWidgetAlgosFromPlugins } = require('../getWidgetAlgosFromPlugins');
      getWidgetAlgosFromPlugins.mockReturnValue([mockAlgorithm]);

      // Create a project with multiple widgets that reference the same algorithm
      const multiWidgetProject: ProjectOutput = {
        ...mockProject,
        pages: [
          {
            ...mockProject.pages[0],
            layouts: [
              { i: 'widget1', x: 0, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2, static: false, isDraggable: true, isResizable: true, resizeHandles: ['se'], isBounded: true },
              { i: 'widget2', x: 6, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2, static: false, isDraggable: true, isResizable: true, resizeHandles: ['se'], isBounded: true },
            ],
            reportWidgets: [
              mockProject.pages[0].reportWidgets[0],
              {
                ...mockProject.pages[0].reportWidgets[0],
                widgetGID: 'plugin1:widget2',
                key: 'widget2',
              },
            ],
          },
        ],
      };

      const result = transformProjectOutputToState(multiWidgetProject, [mockPlugin]);

      expect(result.algorithmsOnReport).toHaveLength(1); // Should not have duplicates
    });

    it('should avoid duplicate input blocks in inputBlocksOnReport', () => {
      const mockInputBlock: InputBlock = {
        gid: 'input-plugin',
        cid: 'input1',
        name: 'Test Input Block',
        description: 'Test input block description',
        group: 'test-group',
        width: '100%',
        version: '1.0.0',
        author: 'Test Author',
        tags: 'test',
        groupNumber: 1,
        fullScreen: false,
      };

      const { getWidgetInputBlocksFromPlugins } = require('../getWidgetInputBlocksFromPlugins');
      getWidgetInputBlocksFromPlugins.mockReturnValue([mockInputBlock]);

      // Create a project with multiple widgets that reference the same input block
      const multiWidgetProject: ProjectOutput = {
        ...mockProject,
        pages: [
          {
            ...mockProject.pages[0],
            layouts: [
              { i: 'widget1', x: 0, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2, static: false, isDraggable: true, isResizable: true, resizeHandles: ['se'], isBounded: true },
              { i: 'widget2', x: 6, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2, static: false, isDraggable: true, isResizable: true, resizeHandles: ['se'], isBounded: true },
            ],
            reportWidgets: [
              mockProject.pages[0].reportWidgets[0],
              {
                ...mockProject.pages[0].reportWidgets[0],
                widgetGID: 'plugin1:widget2',
                key: 'widget2',
              },
            ],
          },
        ],
      };

      const result = transformProjectOutputToState(multiWidgetProject, [mockPlugin]);

      expect(result.inputBlocksOnReport).toHaveLength(1); // Should not have duplicates
    });
  });
}); 