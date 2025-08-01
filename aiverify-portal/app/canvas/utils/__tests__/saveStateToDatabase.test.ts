import {
  saveStateToDatabase,
  debouncedSaveStateToDatabase,
  getProjectIdAndFlowFromUrl,
} from '../saveStateToDatabase';
import type { State } from '@/app/canvas/components/hooks/pagesDesignReducer';

// Mock dependencies
jest.mock('@/lib/fetchApis/getProjects', () => ({
  patchProject: jest.fn(),
}));

jest.mock('../sessionStorage', () => ({
  saveStateToSessionStorage: jest.fn(),
}));

jest.mock('../transformStateToProjectInput', () => ({
  transformStateToProjectInput: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock console methods
const originalConsole = { ...console };
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('saveStateToDatabase', () => {
  const mockState: State = {
    layouts: [
      [
        { i: 'widget1', x: 0, y: 0, w: 6, h: 4 },
        { i: 'widget2', x: 6, y: 0, w: 6, h: 4 },
      ],
      [
        { i: 'widget3', x: 0, y: 0, w: 12, h: 8 },
      ],
    ],
    widgets: [
      [
        {
          cid: 'widget1',
          name: 'Test Widget 1',
          version: '1.0.0',
          author: 'Test Author',
          description: 'Test widget description',
          widgetSize: { minW: 2, minH: 2, maxW: 12, maxH: 12 },
          properties: [],
          tags: 'test,widget',
          dependencies: [],
          mockdata: [],
          dynamicHeight: false,
          gid: 'plugin1',
          mdx: { code: 'test mdx code', frontmatter: {} },
          gridItemId: 'widget1',
        },
        {
          cid: 'widget2',
          name: 'Test Widget 2',
          version: '1.0.0',
          author: 'Test Author',
          description: 'Test widget description',
          widgetSize: { minW: 2, minH: 2, maxW: 12, maxH: 12 },
          properties: [],
          tags: 'test,widget',
          dependencies: [],
          mockdata: [],
          dynamicHeight: false,
          gid: 'plugin1',
          mdx: { code: 'test mdx code', frontmatter: {} },
          gridItemId: 'widget2',
        },
      ],
      [
        {
          cid: 'widget3',
          name: 'Test Widget 3',
          version: '1.0.0',
          author: 'Test Author',
          description: 'Test widget description',
          widgetSize: { minW: 2, minH: 2, maxW: 12, maxH: 12 },
          properties: [],
          tags: 'test,widget',
          dependencies: [],
          mockdata: [],
          dynamicHeight: false,
          gid: 'plugin1',
          mdx: { code: 'test mdx code', frontmatter: {} },
          gridItemId: 'widget3',
        },
      ],
    ],
    algorithmsOnReport: [],
    inputBlocksOnReport: [],
    gridItemToAlgosMap: {},
    gridItemToInputBlockDatasMap: {},
    currentPage: 0,
    showGrid: true,
    pageTypes: ['grid', 'grid'],
    overflowParents: [null, null],
    useRealData: false,
  };

  const stateWithOverflow: State = {
    ...mockState,
    layouts: [
      [{ i: 'widget1', x: 0, y: 0, w: 6, h: 4 }],
      [{ i: 'widget2', x: 0, y: 0, w: 6, h: 4 }],
      [{ i: 'widget3', x: 0, y: 0, w: 6, h: 4 }],
    ],
    widgets: [
      [{ cid: 'widget1', name: 'Widget 1', version: '1.0.0', author: 'Test', description: 'Test', widgetSize: { minW: 2, minH: 2, maxW: 12, maxH: 12 }, properties: [], tags: 'test', dependencies: [], mockdata: [], dynamicHeight: false, gid: 'plugin1', mdx: { code: 'test', frontmatter: {} }, gridItemId: 'widget1' }],
      [{ cid: 'widget2', name: 'Widget 2', version: '1.0.0', author: 'Test', description: 'Test', widgetSize: { minW: 2, minH: 2, maxW: 12, maxH: 12 }, properties: [], tags: 'test', dependencies: [], mockdata: [], dynamicHeight: false, gid: 'plugin1', mdx: { code: 'test', frontmatter: {} }, gridItemId: 'widget2' }],
      [{ cid: 'widget3', name: 'Widget 3', version: '1.0.0', author: 'Test', description: 'Test', widgetSize: { minW: 2, minH: 2, maxW: 12, maxH: 12 }, properties: [], tags: 'test', dependencies: [], mockdata: [], dynamicHeight: false, gid: 'plugin1', mdx: { code: 'test', frontmatter: {} }, gridItemId: 'widget3' }],
    ],
    pageTypes: ['grid', 'overflow', 'overflow'],
    overflowParents: [null, 0, 0],
  };

  let urlSearchParamsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsole.log;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.getItem.mockReturnValue(null);
    window.location.search = '?projectId=test-project-123&flow=test-flow';
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    if (urlSearchParamsSpy) urlSearchParamsSpy.mockRestore();
  });

  describe('getProjectIdAndFlowFromUrl', () => {
    it('should return project ID and flow from URL parameters', () => {
      const mockGet = jest.fn()
        .mockReturnValueOnce('test-project-123')
        .mockReturnValueOnce('test-flow');
      urlSearchParamsSpy = jest.spyOn(global, 'URLSearchParams').mockImplementation(() => ({
        get: mockGet,
      } as any));
      const result = getProjectIdAndFlowFromUrl();
      expect(result).toEqual({
        projectId: 'test-project-123',
        flow: 'test-flow',
      });
    });

    it('should return null values when window is undefined', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      const result = getProjectIdAndFlowFromUrl();
      expect(result).toEqual({
        projectId: null,
        flow: null,
      });
      global.window = originalWindow;
    });

    it('should handle missing URL parameters', () => {
      const mockGet = jest.fn().mockReturnValue(null);
      urlSearchParamsSpy = jest.spyOn(global, 'URLSearchParams').mockImplementation(() => ({
        get: mockGet,
      } as any));
      const result = getProjectIdAndFlowFromUrl();
      expect(result).toEqual({
        projectId: null,
        flow: null,
      });
    });

    it('should handle partial URL parameters', () => {
      const mockGet = jest.fn()
        .mockReturnValueOnce('test-project-123')
        .mockReturnValueOnce(null);
      urlSearchParamsSpy = jest.spyOn(global, 'URLSearchParams').mockImplementation(() => ({
        get: mockGet,
      } as any));
      const result = getProjectIdAndFlowFromUrl();
      expect(result).toEqual({
        projectId: 'test-project-123',
        flow: null,
      });
    });
  });

  describe('saveStateToDatabase', () => {
    const { patchProject } = require('@/lib/fetchApis/getProjects');
    const { saveStateToSessionStorage } = require('../sessionStorage');
    const { transformStateToProjectInput } = require('../transformStateToProjectInput');

    beforeEach(() => {
      const mockGet = jest.fn()
        .mockReturnValueOnce('test-project-123')
        .mockReturnValueOnce('test-flow');
      urlSearchParamsSpy = jest.spyOn(global, 'URLSearchParams').mockImplementation(() => ({
        get: mockGet,
      } as any));
      window.location.search = '?projectId=test-project-123&flow=test-flow';
    });

    it('should filter out overflow pages when saving to localStorage', async () => {
      await saveStateToDatabase(stateWithOverflow);
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.layouts).toHaveLength(1);
      expect(savedData.pageTypes).toEqual(['grid']);
      expect(savedData.overflowParents).toEqual([null]);
    });

    it('should skip database save when no project ID', async () => {
      const mockGet = jest.fn().mockReturnValue(null);
      urlSearchParamsSpy = jest.spyOn(global, 'URLSearchParams').mockImplementation(() => ({
        get: mockGet,
      } as any));
      await saveStateToDatabase(mockState);
      expect(mockConsole.log).toHaveBeenCalledWith(
        'Template flow or no project ID detected, skipping database save',
        expect.objectContaining({
          isTemplateFlow: false,
          projectId: null,
        })
      );
      expect(patchProject).not.toHaveBeenCalled();
    });

    it('should handle localStorage error gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      await saveStateToDatabase(mockState);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Failed to save minimal state to localStorage:',
        expect.any(Error)
      );
    });

    it('should create minimal state with correct structure', async () => {
      await saveStateToDatabase(mockState);
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveProperty('timestamp');
      expect(savedData).toHaveProperty('projectId', 'test-project-123');
      expect(savedData).toHaveProperty('layouts');
      expect(savedData).toHaveProperty('pageTypes');
      expect(savedData).toHaveProperty('overflowParents');
      expect(savedData).toHaveProperty('lastModified');
      expect(typeof savedData.timestamp).toBe('number');
      expect(typeof savedData.lastModified).toBe('string');
      expect(Array.isArray(savedData.layouts)).toBe(true);
      expect(Array.isArray(savedData.pageTypes)).toBe(true);
      expect(Array.isArray(savedData.overflowParents)).toBe(true);
    });

    it('should handle state with empty layouts', async () => {
      const emptyState: State = {
        ...mockState,
        layouts: [],
        widgets: [],
        pageTypes: [],
        overflowParents: [],
      };
      await saveStateToDatabase(emptyState);
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.layouts).toEqual([]);
      expect(savedData.pageTypes).toEqual([]);
      expect(savedData.overflowParents).toEqual([]);
    });
  });

  describe('debouncedSaveStateToDatabase', () => {
    const { saveStateToSessionStorage } = require('../sessionStorage');

    beforeEach(() => {
      jest.useFakeTimers();
      const mockGet = jest.fn()
        .mockReturnValueOnce('test-project-123')
        .mockReturnValueOnce('test-flow');
      urlSearchParamsSpy = jest.spyOn(global, 'URLSearchParams').mockImplementation(() => ({
        get: mockGet,
      } as any));
      window.location.search = '?projectId=test-project-123&flow=test-flow';
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should save to session storage and localStorage immediately', () => {
      debouncedSaveStateToDatabase(mockState);
      expect(saveStateToSessionStorage).toHaveBeenCalledWith(mockState);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pagesDesignState_minimal',
        expect.stringContaining('test-project-123')
      );
    });

    it('should skip debounced save when no project ID', () => {
      const mockGet = jest.fn().mockReturnValue(null);
      urlSearchParamsSpy = jest.spyOn(global, 'URLSearchParams').mockImplementation(() => ({
        get: mockGet,
      } as any));
      debouncedSaveStateToDatabase(mockState);
      expect(mockConsole.log).toHaveBeenCalledWith(
        'Template flow or no project ID detected, skipping debounced save',
        expect.objectContaining({
          isTemplateFlow: false,
          projectId: null,
        })
      );
    });

    it('should handle localStorage error in debounced function', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      debouncedSaveStateToDatabase(mockState);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Failed to save minimal state to localStorage:',
        expect.any(Error)
      );
    });

    it('should filter overflow pages in debounced function', () => {
      debouncedSaveStateToDatabase(stateWithOverflow);
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.layouts).toHaveLength(1);
      expect(savedData.pageTypes).toEqual(['grid']);
      expect(savedData.overflowParents).toEqual([null]);
    });

    it('should create minimal state with correct structure in debounced function', () => {
      debouncedSaveStateToDatabase(mockState);
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveProperty('timestamp');
      expect(savedData).toHaveProperty('projectId', 'test-project-123');
      expect(savedData).toHaveProperty('layouts');
      expect(savedData).toHaveProperty('pageTypes');
      expect(savedData).toHaveProperty('overflowParents');
      expect(savedData).toHaveProperty('lastModified');
      expect(typeof savedData.timestamp).toBe('number');
      expect(typeof savedData.lastModified).toBe('string');
      expect(Array.isArray(savedData.layouts)).toBe(true);
      expect(Array.isArray(savedData.pageTypes)).toBe(true);
      expect(Array.isArray(savedData.overflowParents)).toBe(true);
    });
  });
}); 