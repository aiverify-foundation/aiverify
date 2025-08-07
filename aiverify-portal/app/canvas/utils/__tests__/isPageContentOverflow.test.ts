import { isPageContentOverflow } from '../isPageContentOverflow';
import { Layout } from 'react-grid-layout';
import { WidgetOnGridLayout } from '@/app/canvas/types';

// Mock the constants
jest.mock('@/app/canvas/components/dimensionsConstants', () => ({
  GRID_HEIGHT: 1000,
  GRID_ROW_HEIGHT: 50,
}));

// Mock the gridItemRootClassName
jest.mock('@/app/canvas/components/gridItemComponent', () => ({
  gridItemRootClassName: 'grid-item-root',
}));

describe('isPageContentOverflow', () => {
  let mockDocument: any;

  beforeEach(() => {
    // Mock document.getElementById and getElementsByClassName
    mockDocument = {
      getElementById: jest.fn(),
    };
    global.document = mockDocument;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return no overflow for empty layouts', () => {
    const layouts: Layout[] = [];
    const widgets: WidgetOnGridLayout[] = [];

    const result = isPageContentOverflow(layouts, widgets);

    expect(result).toEqual({
      overflows: false,
      numOfRequiredPages: 1,
    });
  });

  it('should return no overflow when content fits within one page', () => {
    const layouts: Layout[] = [
      { i: 'widget1', x: 0, y: 0, w: 6, h: 4, minW: 1, minH: 1 },
      { i: 'widget2', x: 6, y: 0, w: 6, h: 4, minW: 1, minH: 1 },
    ];

    const widgets: WidgetOnGridLayout[] = [
      {
        gid: 'plugin1',
        cid: 'widget1',
        name: 'Widget 1',
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
      },
      {
        gid: 'plugin1',
        cid: 'widget2',
        name: 'Widget 2',
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
        gridItemId: 'widget2',
      },
    ];

    // Mock DOM elements with heights that fit within one page
    const mockElement1 = {
      getBoundingClientRect: jest.fn().mockReturnValue({ height: 200 }),
    };
    const mockElement2 = {
      getBoundingClientRect: jest.fn().mockReturnValue({ height: 200 }),
    };

    mockDocument.getElementById
      .mockReturnValueOnce({
        getElementsByClassName: jest.fn().mockReturnValue([mockElement1]),
      })
      .mockReturnValueOnce({
        getElementsByClassName: jest.fn().mockReturnValue([mockElement2]),
      });

    const result = isPageContentOverflow(layouts, widgets);

    expect(result).toEqual({
      overflows: false,
      numOfRequiredPages: 1,
    });
  });

  it('should detect overflow when content exceeds page height', () => {
    const layouts: Layout[] = [
      { i: 'widget1', x: 0, y: 0, w: 12, h: 15, minW: 1, minH: 1 }, // 15 * 50 = 750px
      { i: 'widget2', x: 0, y: 15, w: 12, h: 10, minW: 1, minH: 1 }, // 10 * 50 = 500px
    ];

    const widgets: WidgetOnGridLayout[] = [
      {
        gid: 'plugin1',
        cid: 'widget1',
        name: 'Widget 1',
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
      },
      {
        gid: 'plugin1',
        cid: 'widget2',
        name: 'Widget 2',
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
        gridItemId: 'widget2',
      },
    ];

    // Mock DOM elements with heights that exceed page height
    const mockElement1 = {
      getBoundingClientRect: jest.fn().mockReturnValue({ height: 800 }),
    };
    const mockElement2 = {
      getBoundingClientRect: jest.fn().mockReturnValue({ height: 600 }),
    };

    mockDocument.getElementById
      .mockReturnValueOnce({
        getElementsByClassName: jest.fn().mockReturnValue([mockElement1]),
      })
      .mockReturnValueOnce({
        getElementsByClassName: jest.fn().mockReturnValue([mockElement2]),
      });

    const result = isPageContentOverflow(layouts, widgets);

    expect(result.overflows).toBe(true);
    expect(result.numOfRequiredPages).toBeGreaterThan(1);
  });

  it('should use layout dimensions as fallback when DOM element is not found', () => {
    const layouts: Layout[] = [
      { i: 'widget1', x: 0, y: 0, w: 12, h: 20, minW: 1, minH: 1 }, // 20 * 50 = 1000px
    ];

    const widgets: WidgetOnGridLayout[] = [
      {
        gid: 'plugin1',
        cid: 'widget1',
        name: 'Widget 1',
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
      },
    ];

    // Mock DOM element not found
    mockDocument.getElementById.mockReturnValue(null);

    const result = isPageContentOverflow(layouts, widgets);

    expect(result.overflows).toBe(false);
    expect(result.numOfRequiredPages).toBe(1); // 1000px fits exactly in 1000px page
  });

  it('should skip widgets without gridItemId', () => {
    const layouts: Layout[] = [
      { i: 'widget1', x: 0, y: 0, w: 12, h: 20, minW: 1, minH: 1 },
    ];

    const widgets: WidgetOnGridLayout[] = [
      {
        gid: 'plugin1',
        cid: 'widget1',
        name: 'Widget 1',
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
        gridItemId: '', // Empty gridItemId
      },
    ];

    const result = isPageContentOverflow(layouts, widgets);

    expect(result).toEqual({
      overflows: false,
      numOfRequiredPages: 0, // No valid widgets found
    });
  });

  it('should handle widgets with missing DOM elements', () => {
    const layouts: Layout[] = [
      { i: 'widget1', x: 0, y: 0, w: 12, h: 20, minW: 1, minH: 1 },
    ];

    const widgets: WidgetOnGridLayout[] = [
      {
        gid: 'plugin1',
        cid: 'widget1',
        name: 'Widget 1',
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
      },
    ];

    // Mock DOM element found but no child with gridItemRootClassName
    mockDocument.getElementById.mockReturnValue({
      getElementsByClassName: jest.fn().mockReturnValue([]),
    });

    const result = isPageContentOverflow(layouts, widgets);

    expect(result.overflows).toBe(false);
    expect(result.numOfRequiredPages).toBe(1);
  });

  it('should calculate correct number of pages for large content', () => {
    const layouts: Layout[] = [
      { i: 'widget1', x: 0, y: 0, w: 12, h: 25, minW: 1, minH: 1 }, // 25 * 50 = 1250px
    ];

    const widgets: WidgetOnGridLayout[] = [
      {
        gid: 'plugin1',
        cid: 'widget1',
        name: 'Widget 1',
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
      },
    ];

    // Mock DOM element with large height
    const mockElement = {
      getBoundingClientRect: jest.fn().mockReturnValue({ height: 1500 }),
    };

    mockDocument.getElementById.mockReturnValue({
      getElementsByClassName: jest.fn().mockReturnValue([mockElement]),
    });

    const result = isPageContentOverflow(layouts, widgets);

    expect(result.overflows).toBe(true);
    expect(result.numOfRequiredPages).toBe(2); // 1500px requires 2 pages of 1000px each
  });

  it('should use the greater of grid height and element height', () => {
    const layouts: Layout[] = [
      { i: 'widget1', x: 0, y: 0, w: 12, h: 10, minW: 1, minH: 1 }, // 10 * 50 = 500px
    ];

    const widgets: WidgetOnGridLayout[] = [
      {
        gid: 'plugin1',
        cid: 'widget1',
        name: 'Widget 1',
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
      },
    ];

    // Mock DOM element with height greater than grid height
    const mockElement = {
      getBoundingClientRect: jest.fn().mockReturnValue({ height: 800 }),
    };

    mockDocument.getElementById.mockReturnValue({
      getElementsByClassName: jest.fn().mockReturnValue([mockElement]),
    });

    const result = isPageContentOverflow(layouts, widgets);

    // Should use element height (800px) instead of grid height (500px)
    expect(result.overflows).toBe(false);
    expect(result.numOfRequiredPages).toBe(1);
  });

  it('should handle multiple widgets with different heights', () => {
    const layouts: Layout[] = [
      { i: 'widget1', x: 0, y: 0, w: 6, h: 8, minW: 1, minH: 1 }, // 8 * 50 = 400px
      { i: 'widget2', x: 6, y: 0, w: 6, h: 12, minW: 1, minH: 1 }, // 12 * 50 = 600px
      { i: 'widget3', x: 0, y: 8, w: 12, h: 6, minW: 1, minH: 1 }, // 6 * 50 = 300px
    ];

    const widgets: WidgetOnGridLayout[] = [
      {
        gid: 'plugin1',
        cid: 'widget1',
        name: 'Widget 1',
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
      },
      {
        gid: 'plugin1',
        cid: 'widget2',
        name: 'Widget 2',
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
        gridItemId: 'widget2',
      },
      {
        gid: 'plugin1',
        cid: 'widget3',
        name: 'Widget 3',
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
        gridItemId: 'widget3',
      },
    ];

    // Mock DOM elements with different heights
    const mockElement1 = {
      getBoundingClientRect: jest.fn().mockReturnValue({ height: 450 }),
    };
    const mockElement2 = {
      getBoundingClientRect: jest.fn().mockReturnValue({ height: 700 }),
    };
    const mockElement3 = {
      getBoundingClientRect: jest.fn().mockReturnValue({ height: 350 }),
    };

    mockDocument.getElementById
      .mockReturnValueOnce({
        getElementsByClassName: jest.fn().mockReturnValue([mockElement1]),
      })
      .mockReturnValueOnce({
        getElementsByClassName: jest.fn().mockReturnValue([mockElement2]),
      })
      .mockReturnValueOnce({
        getElementsByClassName: jest.fn().mockReturnValue([mockElement3]),
      });

    const result = isPageContentOverflow(layouts, widgets);

    // Widget 2 extends to y=0 + h=12 = 12 rows = 600px, but element height is 700px
    // Widget 3 extends to y=8 + h=6 = 14 rows = 700px, but element height is 350px
    // So the maximum bottom position should be 700px (from widget 2's element height)
    expect(result.overflows).toBe(false);
    expect(result.numOfRequiredPages).toBe(1);
  });

  it('should handle edge case with exact page height', () => {
    const layouts: Layout[] = [
      { i: 'widget1', x: 0, y: 0, w: 12, h: 20, minW: 1, minH: 1 }, // 20 * 50 = 1000px
    ];

    const widgets: WidgetOnGridLayout[] = [
      {
        gid: 'plugin1',
        cid: 'widget1',
        name: 'Widget 1',
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
      },
    ];

    // Mock DOM element with exact page height
    const mockElement = {
      getBoundingClientRect: jest.fn().mockReturnValue({ height: 1000 }),
    };

    mockDocument.getElementById.mockReturnValue({
      getElementsByClassName: jest.fn().mockReturnValue([mockElement]),
    });

    const result = isPageContentOverflow(layouts, widgets);

    expect(result.overflows).toBe(false);
    expect(result.numOfRequiredPages).toBe(1);
  });
}); 