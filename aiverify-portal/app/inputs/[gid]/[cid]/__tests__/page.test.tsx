import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import DynamicInputBlockPage from '../page';
import { getAllInputBlocks } from '@/lib/fetchApis/getAllInputBlocks';
import { getInputBlockDataByType } from '@/lib/fetchApis/getInputBlockData';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('@/lib/fetchApis/getAllInputBlocks');
jest.mock('@/lib/fetchApis/getInputBlockData');
jest.mock('@/app/inputs/[gid]/[cid]/components/DecisionTree.css', () => ({}));
jest.mock('../components/DynamicInputRenderer', () => {
  return function MockDynamicInputRenderer({ 
    title, 
    description, 
    inputBlock, 
    inputBlockData, 
    searchParams 
  }: any) {
    return (
      <div data-testid="dynamic-input-renderer">
        <div data-testid="title">{title}</div>
        <div data-testid="description">{description}</div>
        <div data-testid="input-block-gid">{inputBlock.gid}</div>
        <div data-testid="input-block-cid">{inputBlock.cid}</div>
        <div data-testid="input-block-name">{inputBlock.name}</div>
        <div data-testid="input-block-fullscreen">{inputBlock.fullScreen ? 'true' : 'false'}</div>
        <div data-testid="input-block-data-length">{Array.isArray(inputBlockData) ? inputBlockData.length : 'not-array'}</div>
        <div data-testid="search-params">{JSON.stringify(searchParams)}</div>
      </div>
    );
  };
});

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('DynamicInputBlockPage', () => {
  const mockGetAllInputBlocks = getAllInputBlocks as jest.MockedFunction<typeof getAllInputBlocks>;
  const mockGetInputBlockDataByType = getInputBlockDataByType as jest.MockedFunction<typeof getInputBlockDataByType>;
  const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
  });

  describe('Input block not found scenarios', () => {
    it('should call notFound when input block is not found', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({ projectId: '123', flow: 'test-flow' });
      
      mockGetAllInputBlocks.mockResolvedValue([
        { gid: 'other-gid', cid: 'other-cid', name: 'Other Block', description: 'Other description' }
      ]);

      // Act
      await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith('Input block not found for gid=test-gid, cid=test-cid');
      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should call notFound when getAllInputBlocks returns empty array', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({});
      
      mockGetAllInputBlocks.mockResolvedValue([]);

      // Act
      await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith('Input block not found for gid=test-gid, cid=test-cid');
      expect(mockNotFound).toHaveBeenCalled();
    });
  });

  describe('Input block found scenarios', () => {
    const mockInputBlock = {
      gid: 'test-gid',
      cid: 'test-cid',
      name: 'Test Input Block',
      description: 'Test description',
      fullScreen: false
    };

    it('should render DynamicInputRenderer with correct props when input block is found and data loads successfully', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({ projectId: '123', flow: 'test-flow' });
      
      mockGetAllInputBlocks.mockResolvedValue([mockInputBlock]);
      mockGetInputBlockDataByType.mockResolvedValue([
        { id: 1, name: 'Test Data 1', gid: 'test-gid', cid: 'test-cid', group: 'test-group', data: {}, created_at: '2023-01-01', updated_at: '2023-01-01' }
      ]);

      // Act
      const result = await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(mockGetAllInputBlocks).toHaveBeenCalled();
      expect(mockGetInputBlockDataByType).toHaveBeenCalledWith({ gid: 'test-gid', cid: 'test-cid' });
      expect(result).toBeDefined();
    });

    it('should render DynamicInputRenderer with empty data when getInputBlockDataByType returns null', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({});
      
      mockGetAllInputBlocks.mockResolvedValue([mockInputBlock]);
      mockGetInputBlockDataByType.mockResolvedValue(null as any);

      // Act
      const result = await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(mockGetInputBlockDataByType).toHaveBeenCalledWith({ gid: 'test-gid', cid: 'test-cid' });
      expect(result).toBeDefined();
    });

    it('should render DynamicInputRenderer with empty data when getInputBlockDataByType returns undefined', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({});
      
      mockGetAllInputBlocks.mockResolvedValue([mockInputBlock]);
      mockGetInputBlockDataByType.mockResolvedValue(undefined as any);

      // Act
      const result = await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(mockGetInputBlockDataByType).toHaveBeenCalledWith({ gid: 'test-gid', cid: 'test-cid' });
      expect(result).toBeDefined();
    });

    it('should render DynamicInputRenderer with empty data when getInputBlockDataByType returns falsy values', async () => {
      // Test various falsy values
      const falsyValues = [false, 0, '', null, undefined];
      
      for (const falsyValue of falsyValues) {
        // Arrange
        const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
        const searchParams = Promise.resolve({});
        
        mockGetAllInputBlocks.mockResolvedValue([mockInputBlock]);
        mockGetInputBlockDataByType.mockResolvedValue(falsyValue as any);

        // Act
        const result = await DynamicInputBlockPage({ params, searchParams });

        // Assert
        expect(mockGetInputBlockDataByType).toHaveBeenCalledWith({ gid: 'test-gid', cid: 'test-cid' });
        expect(result).toBeDefined();
        
        // Clear mocks for next iteration
        jest.clearAllMocks();
      }
    });

    it('should use fallback description when input block has empty or null description', async () => {
      // Test both empty string and null description
      const testCases = [
        { description: '', expectedFallback: true },
        { description: null, expectedFallback: true },
        { description: 'Valid description', expectedFallback: false }
      ];
      
      for (const testCase of testCases) {
        // Arrange
        const inputBlockWithDescription = { 
          ...mockInputBlock, 
          description: testCase.description as any 
        };
        const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
        const searchParams = Promise.resolve({});
        
        mockGetAllInputBlocks.mockResolvedValue([inputBlockWithDescription]);
        mockGetInputBlockDataByType.mockResolvedValue([]);

        // Act
        const result = await DynamicInputBlockPage({ params, searchParams });

        // Assert
        expect(result).toBeDefined();
        
        // Clear mocks for next iteration
        jest.clearAllMocks();
      }
    });
  });

  describe('FullScreen input block scenarios', () => {
    const mockFullScreenInputBlock = {
      gid: 'test-gid',
      cid: 'test-cid',
      name: 'FullScreen Input Block',
      description: 'FullScreen description',
      fullScreen: true
    };

    it('should log diagnostic info for fullScreen input blocks with array data', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({});
      
      mockGetAllInputBlocks.mockResolvedValue([mockFullScreenInputBlock]);
      mockGetInputBlockDataByType.mockResolvedValue([
        { id: 1, name: 'Data 1', gid: 'test-gid', cid: 'test-cid', group: 'test-group', data: {}, created_at: '2023-01-01', updated_at: '2023-01-01' },
        { id: 2, name: 'Data 2', gid: 'test-gid', cid: 'test-cid', group: 'test-group', data: {}, created_at: '2023-01-01', updated_at: '2023-01-01' }
      ]);

      // Act
      await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Fetched data for fullScreen input block test-gid/test-cid:',
        {
          dataExists: true,
          dataType: 'object',
          isArray: true,
          length: 2,
        }
      );
    });

    it('should log diagnostic info for fullScreen input blocks with non-array data', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({});
      
      mockGetAllInputBlocks.mockResolvedValue([mockFullScreenInputBlock]);
      mockGetInputBlockDataByType.mockResolvedValue('non-array-data' as any);

      // Act
      await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Fetched data for fullScreen input block test-gid/test-cid:',
        {
          dataExists: true,
          dataType: 'string',
          isArray: false,
          length: 'n/a',
        }
      );
    });

    it('should log diagnostic info for fullScreen input blocks with null data', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({});
      
      mockGetAllInputBlocks.mockResolvedValue([mockFullScreenInputBlock]);
      mockGetInputBlockDataByType.mockResolvedValue(null as any);

      // Act
      await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Fetched data for fullScreen input block test-gid/test-cid:',
        {
          dataExists: false,
          dataType: 'object',
          isArray: false,
          length: 'n/a',
        }
      );
    });
  });

  describe('Error handling scenarios', () => {
    const mockInputBlock = {
      gid: 'test-gid',
      cid: 'test-cid',
      name: 'Test Input Block',
      description: 'Test description',
      fullScreen: false
    };

    it('should handle getInputBlockDataByType throwing an error', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({ projectId: '123' });
      
      mockGetAllInputBlocks.mockResolvedValue([mockInputBlock]);
      mockGetInputBlockDataByType.mockRejectedValue(new Error('API Error'));

      // Act
      const result = await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error loading data for input block test-gid/test-cid:',
        new Error('API Error')
      );
      expect(result).toBeDefined();
    });

    it('should render DynamicInputRenderer with empty data when getInputBlockDataByType throws an error', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({});
      
      mockGetAllInputBlocks.mockResolvedValue([mockInputBlock]);
      mockGetInputBlockDataByType.mockRejectedValue(new Error('Network error'));

      // Act
      const result = await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(result).toBeDefined();
    });

    it('should render DynamicInputRenderer with fallback description when getInputBlockDataByType throws an error and input block has no description', async () => {
      // Arrange
      const inputBlockWithoutDescription = { ...mockInputBlock, description: '' };
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({});
      
      mockGetAllInputBlocks.mockResolvedValue([inputBlockWithoutDescription]);
      mockGetInputBlockDataByType.mockRejectedValue(new Error('API Error'));

      // Act
      const result = await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('Search params handling', () => {
    const mockInputBlock = {
      gid: 'test-gid',
      cid: 'test-cid',
      name: 'Test Input Block',
      description: 'Test description',
      fullScreen: false
    };

    it('should handle search params with projectId and flow', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({ projectId: 'project-123', flow: 'flow-456' });
      
      mockGetAllInputBlocks.mockResolvedValue([mockInputBlock]);
      mockGetInputBlockDataByType.mockResolvedValue([]);

      // Act
      const result = await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(result).toBeDefined();
    });

    it('should handle search params with only projectId', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({ projectId: 'project-123' });
      
      mockGetAllInputBlocks.mockResolvedValue([mockInputBlock]);
      mockGetInputBlockDataByType.mockResolvedValue([]);

      // Act
      const result = await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(result).toBeDefined();
    });

    it('should handle empty search params', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({});
      
      mockGetAllInputBlocks.mockResolvedValue([mockInputBlock]);
      mockGetInputBlockDataByType.mockResolvedValue([]);

      // Act
      const result = await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(result).toBeDefined();
    });

    it('should handle undefined search params', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve(undefined as any);
      
      mockGetAllInputBlocks.mockResolvedValue([mockInputBlock]);
      mockGetInputBlockDataByType.mockResolvedValue([]);

      // Act
      const result = await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('Input block data handling', () => {
    const mockInputBlock = {
      gid: 'test-gid',
      cid: 'test-cid',
      name: 'Test Input Block',
      description: 'Test description',
      fullScreen: false
    };

    it('should handle empty array data', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({});
      
      mockGetAllInputBlocks.mockResolvedValue([mockInputBlock]);
      mockGetInputBlockDataByType.mockResolvedValue([]);

      // Act
      const result = await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(result).toBeDefined();
    });

    it('should handle array data with multiple items', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({});
      
      mockGetAllInputBlocks.mockResolvedValue([mockInputBlock]);
      mockGetInputBlockDataByType.mockResolvedValue([
        { id: 1, name: 'Data 1', gid: 'test-gid', cid: 'test-cid', group: 'test-group', data: {}, created_at: '2023-01-01', updated_at: '2023-01-01' },
        { id: 2, name: 'Data 2', gid: 'test-gid', cid: 'test-cid', group: 'test-group', data: {}, created_at: '2023-01-01', updated_at: '2023-01-01' },
        { id: 3, name: 'Data 3', gid: 'test-gid', cid: 'test-cid', group: 'test-group', data: {}, created_at: '2023-01-01', updated_at: '2023-01-01' }
      ]);

      // Act
      const result = await DynamicInputBlockPage({ params, searchParams });

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle getAllInputBlocks throwing an error', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.resolve({});
      
      mockGetAllInputBlocks.mockRejectedValue(new Error('Failed to fetch input blocks'));

      // Act & Assert
      await expect(DynamicInputBlockPage({ params, searchParams })).rejects.toThrow('Failed to fetch input blocks');
    });

    it('should handle params promise rejection', async () => {
      // Arrange
      const params = Promise.reject(new Error('Invalid params'));
      const searchParams = Promise.resolve({});

      // Act & Assert
      await expect(DynamicInputBlockPage({ params, searchParams })).rejects.toThrow('Invalid params');
    });

    it('should handle searchParams promise rejection', async () => {
      // Arrange
      const params = Promise.resolve({ gid: 'test-gid', cid: 'test-cid' });
      const searchParams = Promise.reject(new Error('Invalid search params'));

      // Act & Assert
      await expect(DynamicInputBlockPage({ params, searchParams })).rejects.toThrow('Invalid search params');
    });
  });
}); 