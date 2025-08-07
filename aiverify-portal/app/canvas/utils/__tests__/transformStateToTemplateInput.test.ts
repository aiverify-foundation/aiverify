import { transformStateToTemplateInput } from '../transformStateToTemplateInput';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { WidgetAlgoAndResultIdentifier, WidgetInputBlockIdentifier } from '@/app/canvas/components/hooks/pagesDesignReducer';

describe('transformStateToTemplateInput', () => {
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
  };

  describe('basic functionality', () => {
    it('should transform state with multiple pages correctly', () => {
      const result = transformStateToTemplateInput(mockState);

      expect(result.pages!).toHaveLength(2);
      expect(result.pages![0].layouts).toHaveLength(2);
      expect(result.pages![1].layouts).toHaveLength(1);
      expect(result.pages![0].reportWidgets).toHaveLength(2);
      expect(result.pages![1].reportWidgets).toHaveLength(1);
    });

    it('should transform layout properties correctly', () => {
      const result = transformStateToTemplateInput(mockState);

      const layout = result.pages![0].layouts[0];
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
        static: false,
      });
    });

    it('should transform widget properties correctly', () => {
      const result = transformStateToTemplateInput(mockState);

      const widget = result.pages![0].reportWidgets[0];
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
      };

      const result = transformStateToTemplateInput(stateWithNullProperties);

      const widget = result.pages![0].reportWidgets[0];
      expect(widget.properties).toBeNull();
    });

    it('should handle widgets with empty properties array', () => {
      const stateWithEmptyProperties = {
        layouts: [[{ i: 'widget1', x: 0, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2 }]],
        widgets: [[{ ...mockWidget, properties: [] }]],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
      };

      const result = transformStateToTemplateInput(stateWithEmptyProperties);

      const widget = result.pages![0].reportWidgets[0];
      expect(widget.properties).toEqual({}); // Function returns empty object for empty array
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
      };

      const result = transformStateToTemplateInput(stateWithUndefinedValues);

      const widget = result.pages![0].reportWidgets[0];
      expect(widget.properties).toEqual({
        prop1: '',
        prop2: 'value2',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle layouts with missing optional properties', () => {
      const stateWithMinimalLayouts = {
        layouts: [
          [
            { i: 'widget1', x: 0, y: 0, w: 6, h: 4 },
            { i: 'widget2', x: 6, y: 0, w: 6, h: 4 },
          ],
        ],
        widgets: [
          [mockWidget, { ...mockWidget, cid: 'widget2', gridItemId: 'widget2' }],
        ],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
      };

      const result = transformStateToTemplateInput(stateWithMinimalLayouts);

      const layout = result.pages![0].layouts[0];
      expect(layout.maxW).toBe(12);
      expect(layout.maxH).toBe(36);
      expect(layout.minW).toBe(1);
      expect(layout.minH).toBe(1);
      expect(layout.static).toBe(false);
    });

    it('should handle layouts with custom optional properties', () => {
      const stateWithCustomLayouts = {
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
              static: true,
            },
          ],
        ],
        widgets: [
          [mockWidget],
        ],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
      };

      const result = transformStateToTemplateInput(stateWithCustomLayouts);

      const layout = result.pages![0].layouts[0];
      expect(layout.maxW).toBe(8);  // Uses the original value
      expect(layout.maxH).toBe(24); // Uses the original value
      expect(layout.minW).toBe(3);  // Uses the original value
      expect(layout.minH).toBe(3);  // Uses the original value
      expect(layout.static).toBe(false);  // Always set to false by function
    });

    it('should handle single page state', () => {
      const singlePageState = {
        layouts: [mockState.layouts[0]],
        widgets: [mockState.widgets[0]],
        gridItemToAlgosMap: mockState.gridItemToAlgosMap,
        gridItemToInputBlockDatasMap: mockState.gridItemToInputBlockDatasMap,
      };

      const result = transformStateToTemplateInput(singlePageState);

      expect(result.pages!).toHaveLength(1);
      expect(result.pages![0].layouts).toHaveLength(2);
      expect(result.pages![0].reportWidgets).toHaveLength(2);
    });

    it('should handle state with no widgets', () => {
      const noWidgetsState = {
        layouts: [[], []],
        widgets: [[], []],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
      };

      const result = transformStateToTemplateInput(noWidgetsState);

      expect(result.pages!).toHaveLength(2);
      expect(result.pages![0].layouts).toHaveLength(0);
      expect(result.pages![0].reportWidgets).toHaveLength(0);
      expect(result.pages![1].layouts).toHaveLength(0);
      expect(result.pages![1].reportWidgets).toHaveLength(0);
    });

    it('should handle empty state', () => {
      const emptyState = {
        layouts: [],
        widgets: [],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
      };

      const result = transformStateToTemplateInput(emptyState);

      expect(result.pages!).toHaveLength(0);
    });

    it('should handle state with empty pages', () => {
      const emptyPagesState = {
        layouts: [[], []],
        widgets: [[], []],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
      };

      const result = transformStateToTemplateInput(emptyPagesState);

      expect(result.pages!).toHaveLength(2);
      expect(result.pages![0].layouts).toHaveLength(0);
      expect(result.pages![0].reportWidgets).toHaveLength(0);
      expect(result.pages![1].layouts).toHaveLength(0);
      expect(result.pages![1].reportWidgets).toHaveLength(0);
    });

    it('should handle widgets with mixed property values', () => {
      const stateWithMixedProperties = {
        layouts: [[{ i: 'widget1', x: 0, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2 }]],
        widgets: [[{
          ...mockWidget,
          properties: [
            { key: 'stringProp', helper: 'String property', default: 'default', value: 'string value' },
            { key: 'numberProp', helper: 'Number property', default: '0', value: '42' },
            { key: 'emptyProp', helper: 'Empty property', default: '', value: '' },
            { key: 'undefinedProp', helper: 'Undefined property', default: 'default', value: undefined },
          ],
        }]],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
      };

      const result = transformStateToTemplateInput(stateWithMixedProperties);

      const widget = result.pages![0].reportWidgets[0];
      expect(widget.properties).toEqual({
        stringProp: 'string value',
        numberProp: '42',
        emptyProp: '',
        undefinedProp: '',
      });
    });

    it('should handle multiple widgets with different property configurations', () => {
      const stateWithMultipleWidgets = {
        layouts: [
          [
            { i: 'widget1', x: 0, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2 },
            { i: 'widget2', x: 6, y: 0, w: 6, h: 4, maxW: 12, maxH: 12, minW: 2, minH: 2 },
          ],
        ],
        widgets: [
          [
            { ...mockWidget, properties: [{ key: 'prop1', helper: 'Property 1', default: 'value1', value: 'value1' }] },
            { ...mockWidget, cid: 'widget2', gridItemId: 'widget2', properties: null },
          ],
        ],
        gridItemToAlgosMap: {},
        gridItemToInputBlockDatasMap: {},
      };

      const result = transformStateToTemplateInput(stateWithMultipleWidgets);

      expect(result.pages![0].reportWidgets[0].properties).toEqual({ prop1: 'value1' });
      expect(result.pages![0].reportWidgets[1].properties).toBeNull();
    });
  });
}); 