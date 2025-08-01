import {
  saveStateToSessionStorage,
  getStateFromSessionStorage,
  clearSessionStorage,
  hasValidSessionStorage,
} from '../sessionStorage';

// Mock the getProjectIdAndFlowFromUrl function
jest.mock('../saveStateToDatabase', () => ({
  getProjectIdAndFlowFromUrl: jest.fn(),
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('sessionStorage utilities', () => {
  const mockState = {
    layouts: [[{ i: 'widget1', x: 0, y: 0, w: 6, h: 4 }]],
    widgets: [[{
      // Widget properties
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
      // WidgetOnGridLayout additional properties
      mdx: {
        code: 'test mdx code',
        frontmatter: {},
      },
      gridItemId: 'widget1',
    }]],
    algorithmsOnReport: [],
    inputBlocksOnReport: [],
    gridItemToAlgosMap: {},
    gridItemToInputBlockDatasMap: {},
    currentPage: 0,
    showGrid: true,
    pageTypes: ['grid' as const],
    overflowParents: [null],
    useRealData: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    mockSessionStorage.setItem.mockImplementation(() => {});
    mockSessionStorage.removeItem.mockImplementation(() => {});
  });

  describe('saveStateToSessionStorage', () => {
    it('should save state reference to session storage when project ID exists', () => {
      const { getProjectIdAndFlowFromUrl } = require('../saveStateToDatabase');
      getProjectIdAndFlowFromUrl.mockReturnValue({ projectId: 'test-project-123' });

      saveStateToSessionStorage(mockState);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'canvasState',
        expect.stringContaining('test-project-123')
      );

      const savedData = JSON.parse(mockSessionStorage.setItem.mock.calls[0][1]);
      expect(savedData).toEqual({
        projectId: 'test-project-123',
        timestamp: expect.any(Number),
        pageCount: 1,
        lastModified: expect.any(String),
      });
    });

    it('should not save when project ID is null', () => {
      const { getProjectIdAndFlowFromUrl } = require('../saveStateToDatabase');
      getProjectIdAndFlowFromUrl.mockReturnValue({ projectId: null });

      saveStateToSessionStorage(mockState);

      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should not save when project ID is undefined', () => {
      const { getProjectIdAndFlowFromUrl } = require('../saveStateToDatabase');
      getProjectIdAndFlowFromUrl.mockReturnValue({ projectId: undefined });

      saveStateToSessionStorage(mockState);

      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle session storage errors gracefully', () => {
      const { getProjectIdAndFlowFromUrl } = require('../saveStateToDatabase');
      getProjectIdAndFlowFromUrl.mockReturnValue({ projectId: 'test-project-123' });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Session storage error');
      });

      expect(() => saveStateToSessionStorage(mockState)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save state reference to session storage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should save correct page count', () => {
      const { getProjectIdAndFlowFromUrl } = require('../saveStateToDatabase');
      getProjectIdAndFlowFromUrl.mockReturnValue({ projectId: 'test-project-123' });

      const stateWithMultiplePages = {
        ...mockState,
        layouts: [
          [{ i: 'widget1', x: 0, y: 0, w: 6, h: 4 }],
          [{ i: 'widget2', x: 0, y: 0, w: 6, h: 4 }],
          [{ i: 'widget3', x: 0, y: 0, w: 6, h: 4 }],
        ],
      };

      saveStateToSessionStorage(stateWithMultiplePages);

      const savedData = JSON.parse(mockSessionStorage.setItem.mock.calls[0][1]);
      expect(savedData.pageCount).toBe(3);
    });

    it('should include current timestamp', () => {
      const { getProjectIdAndFlowFromUrl } = require('../saveStateToDatabase');
      getProjectIdAndFlowFromUrl.mockReturnValue({ projectId: 'test-project-123' });

      const beforeTime = Date.now();
      saveStateToSessionStorage(mockState);
      const afterTime = Date.now();

      const savedData = JSON.parse(mockSessionStorage.setItem.mock.calls[0][1]);
      expect(savedData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(savedData.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('getStateFromSessionStorage', () => {
    it('should always return null', () => {
      const result = getStateFromSessionStorage();
      expect(result).toBeNull();
    });
  });

  describe('clearSessionStorage', () => {
    it('should remove canvas state from session storage', () => {
      clearSessionStorage();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('canvasState');
    });

    it('should handle session storage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSessionStorage.removeItem.mockImplementation(() => {
        throw new Error('Session storage error');
      });

      expect(() => clearSessionStorage()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear session storage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('hasValidSessionStorage', () => {
    it('should return false when no data exists', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const result = hasValidSessionStorage();

      expect(result).toBe(false);
    });

    it('should return false when data is invalid JSON', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid json');

      const result = hasValidSessionStorage();

      expect(result).toBe(false);
    });

    it('should return false when project ID does not match', () => {
      const { getProjectIdAndFlowFromUrl } = require('../saveStateToDatabase');
      getProjectIdAndFlowFromUrl.mockReturnValue({ projectId: 'current-project' });

      const storedData = {
        projectId: 'different-project',
        timestamp: Date.now(),
      };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(storedData));

      const result = hasValidSessionStorage();

      expect(result).toBe(false);
    });

    it('should return false when reference is older than 24 hours', () => {
      const { getProjectIdAndFlowFromUrl } = require('../saveStateToDatabase');
      getProjectIdAndFlowFromUrl.mockReturnValue({ projectId: 'test-project' });

      const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      const storedData = {
        projectId: 'test-project',
        timestamp: oldTimestamp,
      };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(storedData));

      const result = hasValidSessionStorage();

      expect(result).toBe(false);
    });

    it('should return true when data is valid and recent', () => {
      const { getProjectIdAndFlowFromUrl } = require('../saveStateToDatabase');
      getProjectIdAndFlowFromUrl.mockReturnValue({ projectId: 'test-project' });

      const recentTimestamp = Date.now() - (12 * 60 * 60 * 1000); // 12 hours ago
      const storedData = {
        projectId: 'test-project',
        timestamp: recentTimestamp,
      };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(storedData));

      const result = hasValidSessionStorage();

      expect(result).toBe(true);
    });

    it('should return true when reference is exactly 24 hours old', () => {
      const { getProjectIdAndFlowFromUrl } = require('../saveStateToDatabase');
      getProjectIdAndFlowFromUrl.mockReturnValue({ projectId: 'test-project' });

      const exactTimestamp = Date.now() - (24 * 60 * 60 * 1000) + 1000; // 23 hours 59 minutes 59 seconds ago
      const storedData = {
        projectId: 'test-project',
        timestamp: exactTimestamp,
      };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(storedData));

      const result = hasValidSessionStorage();

      expect(result).toBe(true);
    });

    it('should handle session storage errors gracefully', () => {
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('Session storage error');
      });

      const result = hasValidSessionStorage();

      expect(result).toBe(false);
    });

    it('should handle missing timestamp gracefully', () => {
      const { getProjectIdAndFlowFromUrl } = require('../saveStateToDatabase');
      getProjectIdAndFlowFromUrl.mockReturnValue({ projectId: 'test-project' });

      const storedData = {
        projectId: 'test-project',
        // Missing timestamp
      };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(storedData));

      const result = hasValidSessionStorage();

      expect(result).toBe(false);
    });

    it('should handle missing projectId gracefully', () => {
      const { getProjectIdAndFlowFromUrl } = require('../saveStateToDatabase');
      getProjectIdAndFlowFromUrl.mockReturnValue({ projectId: 'test-project' });

      const storedData = {
        timestamp: Date.now(),
        // Missing projectId
      };
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(storedData));

      const result = hasValidSessionStorage();

      expect(result).toBe(false);
    });
  });
}); 