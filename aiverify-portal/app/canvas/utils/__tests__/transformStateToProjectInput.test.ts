import { transformStateToProjectInput } from '../transformStateToProjectInput';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { WidgetAlgoAndResultIdentifier, WidgetInputBlockIdentifier } from '@/app/canvas/components/hooks/pagesDesignReducer';

describe('transformStateToProjectInput', () => {
  const mockWidget: WidgetOnGridLayout = {
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
    properties: [
      { key: 'prop1', helper: 'Property 1', default: 'value1', value: 'value1' },
      { key: 'prop2', helper: 'Property 2', default: 'value2', value: 'value2' },
    ],
    tags: 'test,widget',
    dependencies: [
      { gid: 'dep-plugin', cid: 'dep-widget', version: '1.0.0' },
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
    gid: 'plugin1',
    mdx: {
      code: 'test mdx code',
      frontmatter: {},
    },
    gridItemId: 'widget1',
  };

  const mockState = {
    layouts: [
      [
        { i: 'widget1', x: 0, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2 },
        { i: 'widget2', x: 6, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2 },
      ],
      [
        { i: 'widget3', x: 0, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2 },
      ],
    ],
    widgets: [
      [mockWidget, { ...mockWidget, cid: 'widget2', gridItemId: 'widget2' }],
      [{ ...mockWidget, cid: 'widget3', gridItemId: 'widget3' }],
    ],
    gridItemToAlgosMap: {
      widget1: [
        { gid: 'algo-plugin', cid: 'algo1', testResultId: 1 },
      ],
      widget2: [
        { gid: 'algo-plugin', cid: 'algo2', testResultId: 2 },
      ],
      widget3: [
        { gid: 'algo-plugin', cid: 'algo3', testResultId: 3 },
      ],
    },
    gridItemToInputBlockDatasMap: {
      widget1: [
        { gid: 'input-plugin', cid: 'input1', inputBlockDataId: 1 },
      ],
      widget2: [
        { gid: 'input-plugin', cid: 'input2', inputBlockDataId: 2 },
      ],
      widget3: [
        { gid: 'input-plugin', cid: 'input3', inputBlockDataId: 3 },
      ],
    },
    pageTypes: ['grid' as const, 'grid' as const],
    overflowParents: [null, null],
  };

  describe('with filterOverflowPages = true (default)', () => {
    it('should transform state with grid pages only', () => {
      const result = transformStateToProjectInput(mockState);

      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].layouts).toHaveLength(2);
      expect(result.pages[1].layouts).toHaveLength(1);
      expect(result.pages[0].reportWidgets).toHaveLength(2);
      expect(result.pages[1].reportWidgets).toHaveLength(1);
    });

    it('should transform layout properties correctly', () => {
      const result = transformStateToProjectInput(mockState);

      const layout = result.pages[0].layouts[0];
      expect(layout).toEqual({
        i: 'widget1',
        x: 0,
        y: 0,
        w: 6,
        h: 4,
        maxW: 12,
        maxH: 12, // Uses the original value from mockState
        minW: 2,  // Uses the original value from mockState
        minH: 2,  // Uses the original value from mockState
        isDraggable: true,
        isResizable: true,
        resizeHandles: ['se'],
        isBounded: true,
        static: false,
      });
    });

    it('should transform widget properties correctly', () => {
      const result = transformStateToProjectInput(mockState);

      const widget = result.pages[0].reportWidgets[0];
      expect(widget).toEqual({
        widgetGID: 'plugin1:widget1',
        key: 'widget1',
        properties: {
          prop1: 'value1',
          prop2: 'value2',
        },
      });
    });

    it('should handle widgets with null properties', () => {
      const stateWithNullProperties = {
        layouts: [[{ i: 'widget1', x: 0, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2 }]],
        widgets: [[{ ...mockWidget, properties: null }]],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
        pageTypes: ['grid' as const],
        overflowParents: [null],
      };

      const result = transformStateToProjectInput(stateWithNullProperties);

      const widget = result.pages[0].reportWidgets[0];
      expect(widget.properties).toEqual({});
    });

    it('should handle widgets with empty properties array', () => {
      const stateWithEmptyProperties = {
        layouts: [[{ i: 'widget1', x: 0, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2 }]],
        widgets: [[{ ...mockWidget, properties: [] }]],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
        pageTypes: ['grid' as const],
        overflowParents: [null],
      };

      const result = transformStateToProjectInput(stateWithEmptyProperties);

      const widget = result.pages[0].reportWidgets[0];
      expect(widget.properties).toEqual({});
    });

    it('should handle widgets with properties that have undefined values', () => {
      const stateWithUndefinedValues = {
        layouts: [[{ i: 'widget1', x: 0, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2 }]],
        widgets: [[{
          ...mockWidget,
          properties: [
            { key: 'prop1', helper: 'Property 1', default: 'value1', value: undefined },
            { key: 'prop2', helper: 'Property 2', default: 'value2', value: 'value2' },
          ],
        }]],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
        pageTypes: ['grid' as const],
        overflowParents: [null],
      };

      const result = transformStateToProjectInput(stateWithUndefinedValues);

      const widget = result.pages[0].reportWidgets[0];
      expect(widget.properties).toEqual({
        prop1: '',
        prop2: 'value2',
      });
    });

    it('should filter out overflow pages', () => {
      const stateWithOverflow = {
        ...mockState,
        pageTypes: ['grid' as const, 'overflow' as const, 'grid' as const],
        overflowParents: [null, 0, null],
        layouts: [
          mockState.layouts[0],
          [{ i: 'overflow-widget', x: 0, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2 }],
          mockState.layouts[1],
        ],
        widgets: [
          mockState.widgets[0],
          [{ ...mockWidget, cid: 'overflow-widget', gridItemId: 'overflow-widget' }],
          mockState.widgets[1],
        ],
      };

      const result = transformStateToProjectInput(stateWithOverflow);

      expect(result.pages).toHaveLength(2); // Should only include grid pages
      expect(result.pages[0].isOverflowPage).toBe(false);
      expect(result.pages[0].overflowParentIndex).toBeNull();
      expect(result.pages[1].isOverflowPage).toBe(false);
      expect(result.pages[1].overflowParentIndex).toBeNull();
    });

    it('should handle empty state', () => {
      const emptyState = {
        layouts: [[], []],
        widgets: [[], []],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
        pageTypes: ['grid' as const, 'grid' as const],
        overflowParents: [null, null],
      };

      const result = transformStateToProjectInput(emptyState);

      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].layouts).toHaveLength(0);
      expect(result.pages[0].reportWidgets).toHaveLength(0);
      expect(result.pages[1].layouts).toHaveLength(0);
      expect(result.pages[1].reportWidgets).toHaveLength(0);
    });
  });

  describe('with filterOverflowPages = false', () => {
    it('should include overflow pages when filterOverflowPages is false', () => {
      const stateWithOverflow = {
        ...mockState,
        pageTypes: ['grid' as const, 'overflow' as const, 'grid' as const],
        overflowParents: [null, 0, null],
        layouts: [
          mockState.layouts[0],
          [{ i: 'overflow-widget', x: 0, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2 }],
          mockState.layouts[1],
        ],
        widgets: [
          mockState.widgets[0],
          [{ ...mockWidget, cid: 'overflow-widget', gridItemId: 'overflow-widget' }],
          mockState.widgets[1],
        ],
      };

      const result = transformStateToProjectInput(stateWithOverflow, { filterOverflowPages: false });

      expect(result.pages).toHaveLength(3); // Should include all pages
      expect(result.pages[0].isOverflowPage).toBe(false);
      expect(result.pages[0].overflowParentIndex).toBeNull();
      expect(result.pages[1].isOverflowPage).toBe(true);
      expect(result.pages[1].overflowParentIndex).toBe(0);
      expect(result.pages[2].isOverflowPage).toBe(false);
      expect(result.pages[2].overflowParentIndex).toBeNull();
    });

    it('should handle mixed page types correctly', () => {
      const mixedState = {
        ...mockState,
        pageTypes: ['grid' as const, 'overflow' as const, 'overflow' as const, 'grid' as const],
        overflowParents: [null, 0, 0, null],
        layouts: [
          mockState.layouts[0],
          [{ i: 'overflow1', x: 0, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2 }],
          [{ i: 'overflow2', x: 0, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2 }],
          mockState.layouts[1],
        ],
        widgets: [
          mockState.widgets[0],
          [{ ...mockWidget, cid: 'overflow1', gridItemId: 'overflow1' }],
          [{ ...mockWidget, cid: 'overflow2', gridItemId: 'overflow2' }],
          mockState.widgets[1],
        ],
      };

      const result = transformStateToProjectInput(mixedState, { filterOverflowPages: false });

      expect(result.pages).toHaveLength(4);
      expect(result.pages[0].isOverflowPage).toBe(false);
      expect(result.pages[1].isOverflowPage).toBe(true);
      expect(result.pages[1].overflowParentIndex).toBe(0);
      expect(result.pages[2].isOverflowPage).toBe(true);
      expect(result.pages[2].overflowParentIndex).toBe(0);
      expect(result.pages[3].isOverflowPage).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle layouts with missing optional properties', () => {
      const stateWithMinimalLayouts = {
        ...mockState,
        layouts: [
          [
            { i: 'widget1', x: 0, y: 0, w: 6, h: 4 },
            { i: 'widget2', x: 6, y: 0, w: 6, h: 4 },
          ],
        ],
        widgets: [
          [mockWidget, { ...mockWidget, cid: 'widget2', gridItemId: 'widget2' }],
        ],
        pageTypes: ['grid' as const],
        overflowParents: [null],
      };

      const result = transformStateToProjectInput(stateWithMinimalLayouts);

      const layout = result.pages[0].layouts[0];
      expect(layout.maxW).toBe(12);
      expect(layout.maxH).toBe(36);
      expect(layout.minW).toBe(1);
      expect(layout.minH).toBe(1);
      expect(layout.isDraggable).toBe(true);
      expect(layout.isResizable).toBe(true);
      expect(layout.resizeHandles).toEqual(['se']);
      expect(layout.isBounded).toBe(true);
      expect(layout.static).toBe(false);
    });

    it('should handle layouts with custom optional properties', () => {
      const stateWithCustomLayouts = {
        ...mockState,
        layouts: [
          [
            {
              i: 'widget1',
              x: 0,
              y: 0,
              w: 6,
              h: 4,
              maxW: 8,
              maxH: 24,
              minW: 3,
              minH: 3,
              isDraggable: false,
              isResizable: false,
              resizeHandles: ['nw' as const, 'se' as const],
              isBounded: false,
              static: true,
            },
          ],
        ],
        widgets: [
          [mockWidget],
        ],
        pageTypes: ['grid' as const],
        overflowParents: [null],
      };

      const result = transformStateToProjectInput(stateWithCustomLayouts);

      const layout = result.pages[0].layouts[0];
      expect(layout.maxW).toBe(8);
      expect(layout.maxH).toBe(24);
      expect(layout.minW).toBe(3);
      expect(layout.minH).toBe(3);
      expect(layout.isDraggable).toBe(true);
      expect(layout.isResizable).toBe(true);
      expect(layout.resizeHandles).toEqual(['se']);
      expect(layout.isBounded).toBe(true);
      expect(layout.static).toBe(false);
    });

    it('should handle single page state', () => {
      const singlePageState = {
        layouts: [mockState.layouts[0]],
        widgets: [mockState.widgets[0]],
        gridItemToAlgosMap: mockState.gridItemToAlgosMap,
        gridItemToInputBlockDatasMap: mockState.gridItemToInputBlockDatasMap,
        pageTypes: ['grid' as const],
        overflowParents: [null],
      };

      const result = transformStateToProjectInput(singlePageState);

      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].layouts).toHaveLength(2);
      expect(result.pages[0].reportWidgets).toHaveLength(2);
    });

    it('should handle state with no widgets', () => {
      const noWidgetsState = {
        layouts: [[], []],
        widgets: [[], []],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
        pageTypes: ['grid' as const, 'grid' as const],
        overflowParents: [null, null],
      };

      const result = transformStateToProjectInput(noWidgetsState);

      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].layouts).toHaveLength(0);
      expect(result.pages[0].reportWidgets).toHaveLength(0);
      expect(result.pages[1].layouts).toHaveLength(0);
      expect(result.pages[1].reportWidgets).toHaveLength(0);
    });
  });
}); 