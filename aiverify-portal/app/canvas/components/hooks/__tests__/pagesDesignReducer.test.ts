import { pagesDesignReducer, initialState, type WidgetAction, type State } from '../pagesDesignReducer';
import { Layout } from 'react-grid-layout';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { Algorithm, InputBlock } from '@/app/types';

// Mock the debounced save function
jest.mock('@/app/canvas/utils/saveStateToDatabase', () => ({
  debouncedSaveStateToDatabase: jest.fn(),
}));

// Mock the findWidgetInsertPosition utility
jest.mock('../utils/findWidgetInsertPosition', () => ({
  findWidgetInsertPosition: jest.fn((layouts: Layout[], newLayout: Layout) => {
    // Simple mock that returns the length of layouts (append to end)
    return layouts.length;
  }),
}));

describe('pagesDesignReducer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state for unknown action', () => {
      const action = { type: 'UNKNOWN_ACTION' as any };
      const result = pagesDesignReducer(initialState, action);
      expect(result).toEqual(initialState);
    });

    it('should have correct initial state structure', () => {
      expect(initialState).toEqual({
        layouts: [[]],
        widgets: [[]],
        algorithmsOnReport: [],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
        currentPage: 0,
        showGrid: true,
        pageTypes: ['grid'],
        overflowParents: [null],
        inputBlocksOnReport: [],
        useRealData: false,
      });
    });
  });

  describe('ADD_WIDGET_TO_CANVAS', () => {
    const mockLayout: Layout = {
      i: 'widget-1',
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      minW: 1,
      minH: 1,
      maxW: 12,
      maxH: 12,
    };

    const mockWidget: WidgetOnGridLayout = {
      gridItemId: 'widget-1',
      gid: 'test-plugin',
      cid: 'test-widget',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test widget description',
      widgetSize: {
        minW: 1,
        minH: 1,
        maxW: 12,
        maxH: 12,
      },
      properties: [],
      tags: 'test',
      dependencies: [],
      mockdata: [],
      dynamicHeight: false,
      mdx: { code: '', frontmatter: undefined },
    };

    const mockAlgorithm: Algorithm = {
      gid: 'test-plugin',
      cid: 'test-algo',
      name: 'Test Algorithm',
      modelType: ['classification'],
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test algorithm description',
      tags: ['test'],
      requireGroundTruth: true,
      language: 'python',
      script: 'test_script.py',
      module_name: 'test_module',
      inputSchema: {
        title: 'Test Input Schema',
        description: 'Test input schema description',
        type: 'object',
        required: ['input'],
        properties: {},
      },
      outputSchema: {
        title: 'Test Output Schema',
        description: 'Test output schema description',
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
            description: 'Algorithm results',
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
      zip_hash: 'test-hash',
    };

    const mockInputBlock: InputBlock = {
      gid: 'test-plugin',
      cid: 'test-input-block',
      name: 'Test Input Block',
      description: 'Test input block description',
      group: 'test-group',
    };

    it('should add widget to canvas with algorithms and input blocks', () => {
      const action: WidgetAction = {
        type: 'ADD_WIDGET_TO_CANVAS',
        itemLayout: mockLayout,
        widget: mockWidget,
        gridItemAlgosMap: [{ gid: 'test-plugin', cid: 'test-algo', testResultId: 1 }],
        gridItemInputBlockDatasMap: [{ gid: 'test-plugin', cid: 'test-input-block', inputBlockDataId: 1 }],
        algorithms: [mockAlgorithm],
        inputBlocks: [mockInputBlock],
        pageIndex: 0,
      };

      const result = pagesDesignReducer(initialState, action);

      expect(result.layouts[0]).toHaveLength(1);
      expect(result.widgets[0]).toHaveLength(1);
      expect(result.layouts[0][0]).toEqual(mockLayout);
      expect(result.widgets[0][0]).toEqual(mockWidget);
      expect(result.algorithmsOnReport).toHaveLength(1);
      expect(result.inputBlocksOnReport).toHaveLength(1);
      expect(result.gridItemToAlgosMap['widget-1']).toHaveLength(1);
      expect(result.gridItemToInputBlockDatasMap['widget-1']).toHaveLength(1);
    });

    it('should add widget without algorithms and input blocks', () => {
      const action: WidgetAction = {
        type: 'ADD_WIDGET_TO_CANVAS',
        itemLayout: mockLayout,
        widget: mockWidget,
        gridItemAlgosMap: undefined,
        gridItemInputBlockDatasMap: undefined,
        algorithms: [],
        inputBlocks: [],
        pageIndex: 0,
      };

      const result = pagesDesignReducer(initialState, action);

      expect(result.layouts[0]).toHaveLength(1);
      expect(result.widgets[0]).toHaveLength(1);
      expect(result.algorithmsOnReport).toHaveLength(0);
      expect(result.inputBlocksOnReport).toHaveLength(0);
      expect(result.gridItemToAlgosMap['widget-1']).toBeUndefined();
      expect(result.gridItemToInputBlockDatasMap['widget-1']).toBeUndefined();
    });

    it('should merge existing algorithms and input blocks', () => {
      const stateWithExisting: State = {
        ...initialState,
        algorithmsOnReport: [mockAlgorithm],
        inputBlocksOnReport: [mockInputBlock],
        gridItemToAlgosMap: {
          'widget-1': [{ gid: 'test-plugin', cid: 'test-algo', testResultId: 1 }],
        },
        gridItemToInputBlockDatasMap: {
          'widget-1': [{ gid: 'test-plugin', cid: 'test-input-block', inputBlockDataId: 1 }],
        },
      };

      const action: WidgetAction = {
        type: 'ADD_WIDGET_TO_CANVAS',
        itemLayout: mockLayout,
        widget: mockWidget,
        gridItemAlgosMap: [{ gid: 'test-plugin', cid: 'test-algo-2', testResultId: 2 }],
        gridItemInputBlockDatasMap: [{ gid: 'test-plugin', cid: 'test-input-block-2', inputBlockDataId: 2 }],
        algorithms: [{ ...mockAlgorithm, cid: 'test-algo-2' }],
        inputBlocks: [{ ...mockInputBlock, cid: 'test-input-block-2' }],
        pageIndex: 0,
      };

      const result = pagesDesignReducer(stateWithExisting, action);

      expect(result.algorithmsOnReport).toHaveLength(2);
      expect(result.inputBlocksOnReport).toHaveLength(2);
      expect(result.gridItemToAlgosMap['widget-1']).toHaveLength(2);
      expect(result.gridItemToInputBlockDatasMap['widget-1']).toHaveLength(2);
    });

    it('should add widget to specific page index', () => {
      const stateWithMultiplePages: State = {
        ...initialState,
        layouts: [[], []],
        widgets: [[], []],
        pageTypes: ['grid', 'grid'],
        overflowParents: [null, null],
      };

      const action: WidgetAction = {
        type: 'ADD_WIDGET_TO_CANVAS',
        itemLayout: mockLayout,
        widget: mockWidget,
        gridItemAlgosMap: undefined,
        gridItemInputBlockDatasMap: undefined,
        algorithms: [],
        inputBlocks: [],
        pageIndex: 1,
      };

      const result = pagesDesignReducer(stateWithMultiplePages, action);

      expect(result.layouts[0]).toHaveLength(0);
      expect(result.layouts[1]).toHaveLength(1);
      expect(result.widgets[0]).toHaveLength(0);
      expect(result.widgets[1]).toHaveLength(1);
    });
  });

  describe('DELETE_WIDGET_FROM_CANVAS', () => {
    const mockWidget: WidgetOnGridLayout = {
      gridItemId: 'widget-1',
      gid: 'test-plugin',
      cid: 'test-widget',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test widget description',
      widgetSize: {
        minW: 1,
        minH: 1,
        maxW: 12,
        maxH: 12,
      },
      properties: [],
      tags: 'test',
      dependencies: [],
      mockdata: [],
      dynamicHeight: false,
      mdx: { code: '', frontmatter: undefined },
    };

    const mockLayout: Layout = {
      i: 'widget-1',
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      minW: 1,
      minH: 1,
      maxW: 12,
      maxH: 12,
    };

    it('should delete widget and clean up related data', () => {
      const stateWithWidget: State = {
        ...initialState,
        layouts: [[mockLayout]],
        widgets: [[mockWidget]],
        gridItemToAlgosMap: {
          'widget-1': [{ gid: 'test-plugin', cid: 'test-algo', testResultId: 1 }],
        },
        gridItemToInputBlockDatasMap: {
          'widget-1': [{ gid: 'test-plugin', cid: 'test-input-block', inputBlockDataId: 1 }],
        },
        algorithmsOnReport: [{ gid: 'test-plugin', cid: 'test-algo' } as Algorithm],
        inputBlocksOnReport: [{ gid: 'test-plugin', cid: 'test-input-block' } as InputBlock],
      };

      const action: WidgetAction = {
        type: 'DELETE_WIDGET_FROM_CANVAS',
        index: 0,
        pageIndex: 0,
      };

      const result = pagesDesignReducer(stateWithWidget, action);

      expect(result.layouts[0]).toHaveLength(0);
      expect(result.widgets[0]).toHaveLength(0);
      expect(result.gridItemToAlgosMap['widget-1']).toBeUndefined();
      expect(result.gridItemToInputBlockDatasMap['widget-1']).toBeUndefined();
      expect(result.algorithmsOnReport).toHaveLength(0);
      expect(result.inputBlocksOnReport).toHaveLength(0);
    });

    it('should delete widget from specific page index', () => {
      const stateWithMultiplePages: State = {
        ...initialState,
        layouts: [[], [mockLayout]],
        widgets: [[], [mockWidget]],
        pageTypes: ['grid', 'grid'],
        overflowParents: [null, null],
      };

      const action: WidgetAction = {
        type: 'DELETE_WIDGET_FROM_CANVAS',
        index: 0,
        pageIndex: 1,
      };

      const result = pagesDesignReducer(stateWithMultiplePages, action);

      expect(result.layouts[0]).toHaveLength(0);
      expect(result.layouts[1]).toHaveLength(0);
      expect(result.widgets[0]).toHaveLength(0);
      expect(result.widgets[1]).toHaveLength(0);
    });
  });

  describe('RESIZE_WIDGET', () => {
    const mockLayout: Layout = {
      i: 'widget-1',
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      minW: 1,
      minH: 1,
      maxW: 12,
      maxH: 12,
    };

    const resizedLayout: Layout = {
      ...mockLayout,
      w: 8,
      h: 6,
    };

    it('should resize widget successfully', () => {
      const stateWithWidget: State = {
        ...initialState,
        layouts: [[mockLayout]],
        widgets: [[]],
      };

      const action: WidgetAction = {
        type: 'RESIZE_WIDGET',
        itemLayout: resizedLayout,
        pageIndex: 0,
      };

      const result = pagesDesignReducer(stateWithWidget, action);

      expect(result.layouts[0][0]).toEqual(resizedLayout);
    });

    it('should return current state when layout not found', () => {
      const stateWithWidget: State = {
        ...initialState,
        layouts: [[mockLayout]],
        widgets: [[]],
      };

      const action: WidgetAction = {
        type: 'RESIZE_WIDGET',
        itemLayout: { ...resizedLayout, i: 'non-existent' },
        pageIndex: 0,
      };

      const result = pagesDesignReducer(stateWithWidget, action);

      expect(result).toEqual(stateWithWidget);
    });
  });

  describe('CHANGE_WIDGET_POSITION', () => {
    const mockLayout: Layout = {
      i: 'widget-1',
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      minW: 1,
      minH: 1,
      maxW: 12,
      maxH: 12,
    };

    const movedLayout: Layout = {
      ...mockLayout,
      x: 6,
      y: 0,
    };

    const mockWidget: WidgetOnGridLayout = {
      gridItemId: 'widget-1',
      gid: 'test-plugin',
      cid: 'test-widget',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test widget description',
      widgetSize: {
        minW: 1,
        minH: 1,
        maxW: 12,
        maxH: 12,
      },
      properties: [],
      tags: 'test',
      dependencies: [],
      mockdata: [],
      dynamicHeight: false,
      mdx: { code: '', frontmatter: undefined },
    };

    it('should change widget position successfully', () => {
      const stateWithWidget: State = {
        ...initialState,
        layouts: [[mockLayout]],
        widgets: [[mockWidget]],
      };

      const action: WidgetAction = {
        type: 'CHANGE_WIDGET_POSITION',
        itemLayout: movedLayout,
        pageIndex: 0,
      };

      const result = pagesDesignReducer(stateWithWidget, action);

      expect(result.layouts[0][0]).toEqual(movedLayout);
      expect(result.widgets[0][0]).toEqual(mockWidget);
    });

    it('should return current state when layout not found', () => {
      const stateWithWidget: State = {
        ...initialState,
        layouts: [[mockLayout]],
        widgets: [[mockWidget]],
      };

      const action: WidgetAction = {
        type: 'CHANGE_WIDGET_POSITION',
        itemLayout: { ...movedLayout, i: 'non-existent' },
        pageIndex: 0,
      };

      const result = pagesDesignReducer(stateWithWidget, action);

      expect(result).toEqual(stateWithWidget);
    });
  });

  describe('ADD_NEW_PAGE', () => {
    it('should add new page to the end', () => {
      const action: WidgetAction = {
        type: 'ADD_NEW_PAGE',
      };

      const result = pagesDesignReducer(initialState, action);

      expect(result.layouts).toHaveLength(2);
      expect(result.widgets).toHaveLength(2);
      expect(result.pageTypes).toHaveLength(2);
      expect(result.overflowParents).toHaveLength(2);
      expect(result.currentPage).toBe(1);
      expect(result.pageTypes[1]).toBe('grid');
      expect(result.overflowParents[1]).toBe(null);
    });

    it('should add new page when multiple pages exist', () => {
      const stateWithMultiplePages: State = {
        ...initialState,
        layouts: [[], []],
        widgets: [[], []],
        pageTypes: ['grid', 'grid'],
        overflowParents: [null, null],
        currentPage: 1,
      };

      const action: WidgetAction = {
        type: 'ADD_NEW_PAGE',
      };

      const result = pagesDesignReducer(stateWithMultiplePages, action);

      expect(result.layouts).toHaveLength(3);
      expect(result.widgets).toHaveLength(3);
      expect(result.pageTypes).toHaveLength(3);
      expect(result.overflowParents).toHaveLength(3);
      expect(result.currentPage).toBe(2);
    });
  });

  describe('SET_CURRENT_PAGE', () => {
    it('should set current page to specified index', () => {
      const stateWithMultiplePages: State = {
        ...initialState,
        layouts: [[], []],
        widgets: [[], []],
        pageTypes: ['grid', 'grid'],
        overflowParents: [null, null],
        currentPage: 0,
      };

      const action: WidgetAction = {
        type: 'SET_CURRENT_PAGE',
        pageIndex: 1,
      };

      const result = pagesDesignReducer(stateWithMultiplePages, action);

      expect(result.currentPage).toBe(1);
    });
  });

  describe('DELETE_PAGE', () => {
    it('should delete page and adjust current page', () => {
      const stateWithMultiplePages: State = {
        ...initialState,
        layouts: [[], []],
        widgets: [[], []],
        pageTypes: ['grid', 'grid'],
        overflowParents: [null, null],
        currentPage: 1,
      };

      const action: WidgetAction = {
        type: 'DELETE_PAGE',
        pageIndex: 0,
      };

      const result = pagesDesignReducer(stateWithMultiplePages, action);

      expect(result.layouts).toHaveLength(1);
      expect(result.widgets).toHaveLength(1);
      expect(result.pageTypes).toHaveLength(1);
      expect(result.overflowParents).toHaveLength(1);
      expect(result.currentPage).toBe(0);
    });

    it('should delete page with overflow pages', () => {
      const stateWithOverflow: State = {
        ...initialState,
        layouts: [[], [], []],
        widgets: [[], [], []],
        pageTypes: ['grid', 'overflow', 'overflow'],
        overflowParents: [null, 0, 0],
        currentPage: 2,
      };

      const action: WidgetAction = {
        type: 'DELETE_PAGE',
        pageIndex: 0,
      };

      const result = pagesDesignReducer(stateWithOverflow, action);

      expect(result.layouts).toHaveLength(0);
      expect(result.widgets).toHaveLength(0);
      expect(result.pageTypes).toHaveLength(0);
      expect(result.overflowParents).toHaveLength(0);
      expect(result.currentPage).toBe(0);
    });

    it('should clean up widget data when deleting page', () => {
      const mockWidget: WidgetOnGridLayout = {
        gridItemId: 'widget-1',
        gid: 'test-plugin',
        cid: 'test-widget',
        name: 'Test Widget',
        version: '1.0.0',
        author: 'Test Author',
        description: 'Test widget description',
        widgetSize: {
          minW: 1,
          minH: 1,
          maxW: 12,
          maxH: 12,
        },
        properties: [],
        tags: 'test',
        dependencies: [],
        mockdata: [],
        dynamicHeight: false,
        mdx: { code: '', frontmatter: undefined },
      };

      const stateWithWidget: State = {
        ...initialState,
        layouts: [[{ i: 'widget-1', x: 0, y: 0, w: 6, h: 4, minW: 1, minH: 1, maxW: 12, maxH: 12 }]],
        widgets: [[mockWidget]],
        gridItemToAlgosMap: {
          'widget-1': [{ gid: 'test-plugin', cid: 'test-algo', testResultId: 1 }],
        },
        gridItemToInputBlockDatasMap: {
          'widget-1': [{ gid: 'test-plugin', cid: 'test-input-block', inputBlockDataId: 1 }],
        },
        algorithmsOnReport: [{ gid: 'test-plugin', cid: 'test-algo' } as Algorithm],
        inputBlocksOnReport: [{ gid: 'test-plugin', cid: 'test-input-block' } as InputBlock],
      };

      const action: WidgetAction = {
        type: 'DELETE_PAGE',
        pageIndex: 0,
      };

      const result = pagesDesignReducer(stateWithWidget, action);

      expect(result.gridItemToAlgosMap['widget-1']).toBeUndefined();
      expect(result.gridItemToInputBlockDatasMap['widget-1']).toBeUndefined();
      expect(result.algorithmsOnReport).toHaveLength(0);
      expect(result.inputBlocksOnReport).toHaveLength(0);
    });
  });

  describe('TOGGLE_GRID', () => {
    it('should toggle grid visibility', () => {
      const action: WidgetAction = {
        type: 'TOGGLE_GRID',
      };

      const result = pagesDesignReducer(initialState, action);

      expect(result.showGrid).toBe(false);
    });

    it('should toggle grid visibility from false to true', () => {
      const stateWithGridHidden: State = {
        ...initialState,
        showGrid: false,
      };

      const action: WidgetAction = {
        type: 'TOGGLE_GRID',
      };

      const result = pagesDesignReducer(stateWithGridHidden, action);

      expect(result.showGrid).toBe(true);
    });
  });

  describe('UPDATE_WIDGET', () => {
    const mockWidget: WidgetOnGridLayout = {
      gridItemId: 'widget-1',
      gid: 'test-plugin',
      cid: 'test-widget',
      name: 'Test Widget',
      version: '1.0.0',
      author: 'Test Author',
      description: 'Test widget description',
      widgetSize: {
        minW: 1,
        minH: 1,
        maxW: 12,
        maxH: 12,
      },
      properties: [],
      tags: 'test',
      dependencies: [],
      mockdata: [],
      dynamicHeight: false,
      mdx: { code: '', frontmatter: undefined },
    };

    const updatedWidget: WidgetOnGridLayout = {
      ...mockWidget,
      name: 'Updated Widget',
      description: 'Updated description',
    };

    it('should update widget successfully', () => {
      const stateWithWidget: State = {
        ...initialState,
        widgets: [[mockWidget]],
      };

      const action: WidgetAction = {
        type: 'UPDATE_WIDGET',
        widget: updatedWidget,
        pageIndex: 0,
      };

      const result = pagesDesignReducer(stateWithWidget, action);

      expect(result.widgets[0][0]).toEqual(updatedWidget);
    });

    it('should not update when widget not found', () => {
      const stateWithWidget: State = {
        ...initialState,
        widgets: [[mockWidget]],
      };

      const action: WidgetAction = {
        type: 'UPDATE_WIDGET',
        widget: { ...updatedWidget, gridItemId: 'non-existent' },
        pageIndex: 0,
      };

      const result = pagesDesignReducer(stateWithWidget, action);

      expect(result.widgets[0][0]).toEqual(mockWidget);
    });
  });

  describe('ADD_OVERFLOW_PAGES', () => {
    it('should add overflow pages successfully', () => {
      const action: WidgetAction = {
        type: 'ADD_OVERFLOW_PAGES',
        parentPageIndex: 0,
        count: 2,
      };

      const result = pagesDesignReducer(initialState, action);

      expect(result.layouts).toHaveLength(3);
      expect(result.widgets).toHaveLength(3);
      expect(result.pageTypes).toHaveLength(3);
      expect(result.overflowParents).toHaveLength(3);
      expect(result.pageTypes[1]).toBe('overflow');
      expect(result.pageTypes[2]).toBe('overflow');
      expect(result.overflowParents[1]).toBe(0);
      expect(result.overflowParents[2]).toBe(0);
    });

    it('should not add pages when count is zero', () => {
      const action: WidgetAction = {
        type: 'ADD_OVERFLOW_PAGES',
        parentPageIndex: 0,
        count: 0,
      };

      const result = pagesDesignReducer(initialState, action);

      expect(result).toEqual(initialState);
    });

    it('should not add pages when count is negative', () => {
      const action: WidgetAction = {
        type: 'ADD_OVERFLOW_PAGES',
        parentPageIndex: 0,
        count: -1,
      };

      const result = pagesDesignReducer(initialState, action);

      expect(result).toEqual(initialState);
    });

    it('should adjust current page when inserting before it', () => {
      const stateWithMultiplePages: State = {
        ...initialState,
        layouts: [[], []],
        widgets: [[], []],
        pageTypes: ['grid', 'grid'],
        overflowParents: [null, null],
        currentPage: 1,
      };

      const action: WidgetAction = {
        type: 'ADD_OVERFLOW_PAGES',
        parentPageIndex: 0,
        count: 1,
      };

      const result = pagesDesignReducer(stateWithMultiplePages, action);

      expect(result.currentPage).toBe(2);
    });
  });

  describe('REMOVE_OVERFLOW_PAGES', () => {
    it('should remove overflow pages successfully', () => {
      const stateWithOverflow: State = {
        ...initialState,
        layouts: [[], [], []],
        widgets: [[], [], []],
        pageTypes: ['grid', 'overflow', 'overflow'],
        overflowParents: [null, 0, 0],
        currentPage: 0,
      };

      const action: WidgetAction = {
        type: 'REMOVE_OVERFLOW_PAGES',
        parentPageIndex: 0,
      };

      const result = pagesDesignReducer(stateWithOverflow, action);

      expect(result.layouts).toHaveLength(1);
      expect(result.widgets).toHaveLength(1);
      expect(result.pageTypes).toHaveLength(1);
      expect(result.overflowParents).toHaveLength(1);
      expect(result.pageTypes[0]).toBe('grid');
      expect(result.overflowParents[0]).toBe(null);
    });

    it('should not remove pages when no overflow pages exist', () => {
      const action: WidgetAction = {
        type: 'REMOVE_OVERFLOW_PAGES',
        parentPageIndex: 0,
      };

      const result = pagesDesignReducer(initialState, action);

      expect(result).toEqual(initialState);
    });

    it('should adjust current page when removing pages before it', () => {
      const stateWithOverflow: State = {
        ...initialState,
        layouts: [[], [], []],
        widgets: [[], [], []],
        pageTypes: ['grid', 'overflow', 'overflow'],
        overflowParents: [null, 0, 0],
        currentPage: 2,
      };

      const action: WidgetAction = {
        type: 'REMOVE_OVERFLOW_PAGES',
        parentPageIndex: 0,
      };

      const result = pagesDesignReducer(stateWithOverflow, action);

      expect(result.currentPage).toBe(0);
    });
  });

  describe('UPDATE_ALGO_TRACKER', () => {
    it('should update algorithm tracker successfully', () => {
      const stateWithAlgos: State = {
        ...initialState,
        gridItemToAlgosMap: {
          'widget-1': [
            { gid: 'test-plugin', cid: 'test-algo', testResultId: 1 },
            { gid: 'test-plugin', cid: 'test-algo-2', testResultId: 2 },
          ],
        },
      };

      const action: WidgetAction = {
        type: 'UPDATE_ALGO_TRACKER',
        gridItemAlgosMap: [
          { gid: 'test-plugin', cid: 'test-algo', testResultId: 3 },
          { gid: 'test-plugin', cid: 'test-algo-2', testResultId: 4 },
        ],
      };

      const result = pagesDesignReducer(stateWithAlgos, action);

      expect(result.gridItemToAlgosMap['widget-1'][0].testResultId).toBe(3);
      expect(result.gridItemToAlgosMap['widget-1'][1].testResultId).toBe(4);
    });

    it('should reset testResultId when algorithm not found in update', () => {
      const stateWithAlgos: State = {
        ...initialState,
        gridItemToAlgosMap: {
          'widget-1': [
            { gid: 'test-plugin', cid: 'test-algo', testResultId: 1 },
          ],
        },
      };

      const action: WidgetAction = {
        type: 'UPDATE_ALGO_TRACKER',
        gridItemAlgosMap: [
          { gid: 'test-plugin', cid: 'different-algo', testResultId: 2 },
        ],
      };

      const result = pagesDesignReducer(stateWithAlgos, action);

      expect(result.gridItemToAlgosMap['widget-1'][0].testResultId).toBeUndefined();
    });
  });

  describe('UPDATE_INPUT_BLOCK_TRACKER', () => {
    it('should update input block tracker successfully', () => {
      const stateWithInputBlocks: State = {
        ...initialState,
        gridItemToInputBlockDatasMap: {
          'widget-1': [
            { gid: 'test-plugin', cid: 'test-input-block', inputBlockDataId: 1 },
            { gid: 'test-plugin', cid: 'test-input-block-2', inputBlockDataId: 2 },
          ],
        },
      };

      const action: WidgetAction = {
        type: 'UPDATE_INPUT_BLOCK_TRACKER',
        gridItemInputBlockDatasMap: [
          { gid: 'test-plugin', cid: 'test-input-block', inputBlockDataId: 3 },
          { gid: 'test-plugin', cid: 'test-input-block-2', inputBlockDataId: 4 },
        ],
      };

      const result = pagesDesignReducer(stateWithInputBlocks, action);

      expect(result.gridItemToInputBlockDatasMap['widget-1'][0].inputBlockDataId).toBe(3);
      expect(result.gridItemToInputBlockDatasMap['widget-1'][1].inputBlockDataId).toBe(4);
    });

    it('should reset inputBlockDataId when input block not found in update', () => {
      const stateWithInputBlocks: State = {
        ...initialState,
        gridItemToInputBlockDatasMap: {
          'widget-1': [
            { gid: 'test-plugin', cid: 'test-input-block', inputBlockDataId: 1 },
          ],
        },
      };

      const action: WidgetAction = {
        type: 'UPDATE_INPUT_BLOCK_TRACKER',
        gridItemInputBlockDatasMap: [
          { gid: 'test-plugin', cid: 'different-input-block', inputBlockDataId: 2 },
        ],
      };

      const result = pagesDesignReducer(stateWithInputBlocks, action);

      expect(result.gridItemToInputBlockDatasMap['widget-1'][0].inputBlockDataId).toBeUndefined();
    });
  });

  describe('CONVERT_PAGES_TO_OVERFLOW', () => {
    it('should convert pages to overflow successfully', () => {
      const action: WidgetAction = {
        type: 'CONVERT_PAGES_TO_OVERFLOW',
        pageTypes: ['grid', 'overflow', 'overflow'],
        overflowParents: [null, 0, 0],
      };

      const result = pagesDesignReducer(initialState, action);

      expect(result.pageTypes).toEqual(['grid', 'overflow', 'overflow']);
      expect(result.overflowParents).toEqual([null, 0, 0]);
    });
  });

  describe('RESET_PAGES_WITH_OVERFLOW', () => {
    it('should reset pages with overflow successfully', () => {
      const newLayouts = [[], []];
      const newWidgets = [[], []];
      const newPageTypes: ('grid' | 'overflow')[] = ['grid', 'overflow'];
      const newOverflowParents = [null, 0];

      const action: WidgetAction = {
        type: 'RESET_PAGES_WITH_OVERFLOW',
        pageTypes: newPageTypes,
        overflowParents: newOverflowParents,
        layouts: newLayouts,
        widgets: newWidgets,
      };

      const result = pagesDesignReducer(initialState, action);

      expect(result.layouts).toEqual(newLayouts);
      expect(result.widgets).toEqual(newWidgets);
      expect(result.pageTypes).toEqual(newPageTypes);
      expect(result.overflowParents).toEqual(newOverflowParents);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty arrays gracefully', () => {
      const stateWithEmptyArrays: State = {
        ...initialState,
        layouts: [],
        widgets: [],
        pageTypes: [],
        overflowParents: [],
      };

      const action: WidgetAction = {
        type: 'ADD_NEW_PAGE',
      };

      const result = pagesDesignReducer(stateWithEmptyArrays, action);

      expect(result.layouts).toHaveLength(1);
      expect(result.widgets).toHaveLength(1);
      expect(result.pageTypes).toHaveLength(1);
      expect(result.overflowParents).toHaveLength(1);
    });

    it('should handle null and undefined values in algorithms and input blocks', () => {
      const stateWithNulls: State = {
        ...initialState,
        algorithmsOnReport: null as any,
        inputBlocksOnReport: null as any,
      };

      const action: WidgetAction = {
        type: 'DELETE_WIDGET_FROM_CANVAS',
        index: 0,
        pageIndex: 0,
      };

      const result = pagesDesignReducer(stateWithNulls, action);

      expect(result.algorithmsOnReport).toEqual([]);
      expect(result.inputBlocksOnReport).toEqual([]);
    });
  });
}); 