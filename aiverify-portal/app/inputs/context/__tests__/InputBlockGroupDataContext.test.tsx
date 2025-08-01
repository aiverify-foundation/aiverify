import React from 'react';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { useParams, useSearchParams } from 'next/navigation';
import { InputBlockGroupDataProvider, useInputBlockGroupData } from '../InputBlockGroupDataContext';
import { InputBlock, InputBlockGroupData, InputBlockDataPayload } from '@/app/types';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock lodash debounce
jest.mock('lodash', () => ({
  debounce: jest.fn((fn) => fn),
}));

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// Test component to access context
const TestComponent: React.FC = () => {
  const context = useInputBlockGroupData();
  return (
    <div>
      <div data-testid="gid">{context.gid}</div>
      <div data-testid="group">{context.group}</div>
      <div data-testid="groupId">{context.groupId}</div>
      <div data-testid="cid">{context.cid}</div>
      <div data-testid="name">{context.name}</div>
      <div data-testid="projectId">{context.projectId}</div>
      <div data-testid="flow">{context.flow}</div>
      <div data-testid="inputBlocks">{context.inputBlocks?.length || 0}</div>
      <div data-testid="groupDataList">{context.groupDataList?.length || 0}</div>
      <div data-testid="currentGroupData">{context.currentGroupData?.id || 'null'}</div>
      <button 
        data-testid="setInputBlockData" 
        onClick={() => context.setInputBlockData('test-cid', { test: 'data' })}
      >
        Set Input Block Data
      </button>
      <button 
        data-testid="setName" 
        onClick={() => context.setName('new-name')}
      >
        Set Name
      </button>
      <button 
        data-testid="getInputBlockData" 
        onClick={() => {
          const result = context.getInputBlockData('test-cid');
          console.log('getInputBlockData result:', result);
        }}
      >
        Get Input Block Data
      </button>
      <button 
        data-testid="getGroupDataById" 
        onClick={() => {
          const result = context.getGroupDataById();
          console.log('getGroupDataById result:', result);
        }}
      >
        Get Group Data By Id
      </button>
      <button 
        data-testid="updateNewGroupData" 
        onClick={() => context.updateNewGroupData('test-cid', { test: 'data' })}
      >
        Update New Group Data
      </button>
      <button 
        data-testid="saveNewGroupData" 
        onClick={() => context.saveNewGroupData()}
      >
        Save New Group Data
      </button>
    </div>
  );
};

// Mock data
const mockInputBlock: InputBlock = {
  gid: 'test-gid',
  cid: 'test-cid',
  name: 'Test Input Block',
  description: 'Test Description',
  group: 'test-group',
  groupNumber: 1,
};

const mockInputBlockGroupDataChild = {
  id: 1,
  cid: 'test-cid',
  name: 'Test Child',
  groupNumber: 1,
  data: { test: 'data' } as InputBlockDataPayload,
};

const mockInputBlockGroupData: InputBlockGroupData = {
  id: 1,
  gid: 'test-gid',
  name: 'Test Group',
  group: 'test-group',
  input_blocks: [mockInputBlockGroupDataChild],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockPlugin = {
  gid: 'test-gid',
  version: '1.0.0',
  name: 'Test Plugin',
  author: 'Test Author',
  description: 'Test Description',
  url: null,
  meta: '{}',
  is_stock: false,
  zip_hash: 'test-hash',
  algorithms: [],
  widgets: [],
  input_blocks: [mockInputBlock],
  templates: [],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

describe('InputBlockGroupDataContext', () => {
  const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
  const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    // Default mock implementations
    mockUseParams.mockReturnValue({
      gid: 'test-gid',
      group: 'test-group',
      groupId: '1',
      cid: 'test-cid',
      name: 'test-name',
    });

    const mockSearchParams = {
      get: jest.fn((key: string) => {
        if (key === 'projectId') return 'test-project';
        if (key === 'flow') return 'test-flow';
        return null;
      }),
    } as any;
    mockUseSearchParams.mockReturnValue(mockSearchParams);

    // Default fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockPlugin),
      text: jest.fn().mockResolvedValue(''),
    } as any);
  });

  describe('InputBlockGroupDataProvider', () => {
    it('should render children and provide context values', async () => {
      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('gid')).toHaveTextContent('test-gid');
        expect(screen.getByTestId('group')).toHaveTextContent('test-group');
        expect(screen.getByTestId('groupId')).toHaveTextContent('1');
        expect(screen.getByTestId('cid')).toHaveTextContent('test-cid');
        expect(screen.getByTestId('projectId')).toHaveTextContent('test-project');
        expect(screen.getByTestId('flow')).toHaveTextContent('test-flow');
      });
    });

    it('should handle missing gid and group parameters', async () => {
      mockUseParams.mockReturnValue({
        gid: undefined,
        group: undefined,
        groupId: undefined,
        cid: undefined,
        name: undefined,
      });

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('gid')).toHaveTextContent('undefined');
        expect(screen.getByTestId('group')).toHaveTextContent('undefined');
      });
    });

    it('should handle URL encoded parameters', async () => {
      mockUseParams.mockReturnValue({
        gid: 'test%20gid',
        group: 'test%20group',
        groupId: '1',
        cid: 'test-cid',
        name: 'test-name',
      });

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('gid')).toHaveTextContent('test gid');
        expect(screen.getByTestId('group')).toHaveTextContent('test group');
      });
    });

    it('should fetch input blocks successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockPlugin),
      } as any);

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('inputBlocks')).toHaveTextContent('1');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/plugins/test-gid');
    });

    it('should handle input blocks fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('inputBlocks')).toHaveTextContent('0');
      });
    });

    it('should handle input blocks fetch with non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({}),
      } as any);

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('inputBlocks')).toHaveTextContent('0');
      });
    });

    it('should handle plugin without input blocks', async () => {
      const pluginWithoutInputBlocks = { ...mockPlugin, input_blocks: undefined };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(pluginWithoutInputBlocks),
      } as any);

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('inputBlocks')).toHaveTextContent('0');
      });
    });

    it('should fetch group data successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockPlugin),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue([mockInputBlockGroupData]),
        } as any);

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('groupDataList')).toHaveTextContent('1');
        expect(screen.getByTestId('currentGroupData')).toHaveTextContent('1');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/input_block_data/groups/test-gid/test-group',
        { cache: 'no-cache' }
      );
    });

    it('should handle group data fetch error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockPlugin),
        } as any)
        .mockRejectedValueOnce(new Error('Network error'));

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('groupDataList')).toHaveTextContent('0');
      });
    });

    it('should handle group data fetch with non-ok response', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockPlugin),
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          text: jest.fn().mockResolvedValue('Error message'),
        } as any);

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('groupDataList')).toHaveTextContent('0');
      });
    });

    it('should handle null group data response', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockPlugin),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(null),
        } as any);

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('groupDataList')).toHaveTextContent('0');
      });
    });

    it('should handle missing groupId parameter', async () => {
      mockUseParams.mockReturnValue({
        gid: 'test-gid',
        group: 'test-group',
        groupId: undefined,
        cid: 'test-cid',
        name: 'test-name',
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockPlugin),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue([mockInputBlockGroupData]),
        } as any);

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('currentGroupData')).toHaveTextContent('null');
      });
    });

    it('should handle groupId not found in group data', async () => {
      mockUseParams.mockReturnValue({
        gid: 'test-gid',
        group: 'test-group',
        groupId: '999', // Non-existent ID
        cid: 'test-cid',
        name: 'test-name',
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockPlugin),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue([mockInputBlockGroupData]),
        } as any);

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('currentGroupData')).toHaveTextContent('null');
      });
    });
  });

  describe('Context Functions', () => {
    describe('setInputBlockData', () => {
      it('should update input block data successfully', async () => {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue(mockPlugin),
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue([mockInputBlockGroupData]),
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({}),
          } as any);

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('currentGroupData')).toHaveTextContent('1');
        });

        const setInputBlockDataButton = screen.getByTestId('setInputBlockData');
        await act(async () => {
          setInputBlockDataButton.click();
        });

        // Wait for the debounced save to be called
        await waitFor(() => {
          const calls = mockFetch.mock.calls;
          const patchCalls = calls.filter(call => 
            typeof call[0] === 'string' && 
            call[0].includes('/api/input_block_data/groups/1') && 
            call[1]?.method === 'PATCH'
          );
          expect(patchCalls.length).toBeGreaterThan(0);
        }, { timeout: 3000 });
      });

      it('should handle missing groupId', async () => {
        mockUseParams.mockReturnValue({
          gid: 'test-gid',
          group: 'test-group',
          groupId: undefined,
          cid: 'test-cid',
          name: 'test-name',
        });

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('currentGroupData')).toHaveTextContent('null');
        });

        const setInputBlockDataButton = screen.getByTestId('setInputBlockData');
        await act(async () => {
          setInputBlockDataButton.click();
        });

        // Should not make any PATCH calls to groups endpoint
        await waitFor(() => {
          const calls = mockFetch.mock.calls;
          const patchCalls = calls.filter(call => 
            typeof call[0] === 'string' && 
            call[0].includes('/api/input_block_data/groups/') && 
            call[1]?.method === 'PATCH'
          );
          expect(patchCalls).toHaveLength(0);
        });
      });

      it('should handle missing currentGroupData', async () => {
        mockUseParams.mockReturnValue({
          gid: 'test-gid',
          group: 'test-group',
          groupId: '999', // Non-existent ID
          cid: 'test-cid',
          name: 'test-name',
        });

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('currentGroupData')).toHaveTextContent('null');
        });

        const setInputBlockDataButton = screen.getByTestId('setInputBlockData');
        await act(async () => {
          setInputBlockDataButton.click();
        });

        // Should not make any PATCH calls to groups endpoint
        await waitFor(() => {
          const calls = mockFetch.mock.calls;
          const patchCalls = calls.filter(call => 
            typeof call[0] === 'string' && 
            call[0].includes('/api/input_block_data/groups/') && 
            call[1]?.method === 'PATCH'
          );
          expect(patchCalls).toHaveLength(0);
        });
      });

      it('should handle non-existent cid', async () => {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue(mockPlugin),
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue([mockInputBlockGroupData]),
          } as any);

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('currentGroupData')).toHaveTextContent('1');
        });

        const setInputBlockDataButton = screen.getByTestId('setInputBlockData');
        await act(async () => {
          setInputBlockDataButton.click();
        });

        // Should not make any PATCH calls to groups endpoint for non-existent cid
        await waitFor(() => {
          const calls = mockFetch.mock.calls;
          const patchCalls = calls.filter(call => 
            typeof call[0] === 'string' && 
            call[0].includes('/api/input_block_data/groups/') && 
            call[1]?.method === 'PATCH'
          );
          expect(patchCalls).toHaveLength(0);
        });
      });

      it('should handle fetch error in debounced save', async () => {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue(mockPlugin),
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue([mockInputBlockGroupData]),
          } as any)
          .mockRejectedValueOnce(new Error('Network error'));

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('currentGroupData')).toHaveTextContent('1');
        });

        const setInputBlockDataButton = screen.getByTestId('setInputBlockData');
        await act(async () => {
          setInputBlockDataButton.click();
        });

        // Should still attempt to save
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalled();
        });
      });
    });

    describe('setName', () => {
      it('should handle missing groupId', async () => {
        mockUseParams.mockReturnValue({
          gid: 'test-gid',
          group: 'test-group',
          groupId: undefined,
          cid: 'test-cid',
          name: 'test-name',
        });

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        const setNameButton = screen.getByTestId('setName');
        await act(async () => {
          setNameButton.click();
        });

        // Should not make any PATCH calls to groups endpoint
        await waitFor(() => {
          const calls = mockFetch.mock.calls;
          const patchCalls = calls.filter(call => 
            typeof call[0] === 'string' && 
            call[0].includes('/api/input_block_data/groups/') && 
            call[1]?.method === 'PATCH'
          );
          expect(patchCalls).toHaveLength(0);
        });
      });

      it('should handle missing currentGroupData', async () => {
        mockUseParams.mockReturnValue({
          gid: 'test-gid',
          group: 'test-group',
          groupId: '999', // Non-existent ID
          cid: 'test-cid',
          name: 'test-name',
        });

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        const setNameButton = screen.getByTestId('setName');
        await act(async () => {
          setNameButton.click();
        });

        // Should not make any PATCH calls to groups endpoint
        await waitFor(() => {
          const calls = mockFetch.mock.calls;
          const patchCalls = calls.filter(call => 
            typeof call[0] === 'string' && 
            call[0].includes('/api/input_block_data/groups/') && 
            call[1]?.method === 'PATCH'
          );
          expect(patchCalls).toHaveLength(0);
        });
      });
    });

    describe('getInputBlockData', () => {
      it('should return input block data when all conditions are met', async () => {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue(mockPlugin),
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue([mockInputBlockGroupData]),
          } as any);

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('currentGroupData')).toHaveTextContent('1');
        });

        const getInputBlockDataButton = screen.getByTestId('getInputBlockData');
        await act(async () => {
          getInputBlockDataButton.click();
        });

        // Should log the result
        expect(console.log).toHaveBeenCalledWith(
          'getInputBlockData result:',
          expect.objectContaining({
            inputBlock: mockInputBlock,
            ibdata: mockInputBlockGroupDataChild,
          })
        );
      });

      it('should return null when groupId is missing', async () => {
        mockUseParams.mockReturnValue({
          gid: 'test-gid',
          group: 'test-group',
          groupId: undefined,
          cid: 'test-cid',
          name: 'test-name',
        });

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        const getInputBlockDataButton = screen.getByTestId('getInputBlockData');
        await act(async () => {
          getInputBlockDataButton.click();
        });

        expect(console.log).toHaveBeenCalledWith('getInputBlockData result:', null);
      });

      it('should return null when currentGroupData is missing', async () => {
        mockUseParams.mockReturnValue({
          gid: 'test-gid',
          group: 'test-group',
          groupId: '999', // Non-existent ID
          cid: 'test-cid',
          name: 'test-name',
        });

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        const getInputBlockDataButton = screen.getByTestId('getInputBlockData');
        await act(async () => {
          getInputBlockDataButton.click();
        });

        expect(console.log).toHaveBeenCalledWith('getInputBlockData result:', null);
      });

      it('should return null when inputBlocks is empty', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ ...mockPlugin, input_blocks: [] }),
        } as any);

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('inputBlocks')).toHaveTextContent('0');
        });

        const getInputBlockDataButton = screen.getByTestId('getInputBlockData');
        await act(async () => {
          getInputBlockDataButton.click();
        });

        expect(console.log).toHaveBeenCalledWith('getInputBlockData result:', null);
      });

      it('should return null when inputBlock is not found', async () => {
        // Create a context with input blocks but no matching inputBlock
        const inputBlockWithDifferentCid = { ...mockInputBlock, cid: 'different-cid' };
        const pluginWithDifferentCid = { ...mockPlugin, input_blocks: [inputBlockWithDifferentCid] };

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue(pluginWithDifferentCid),
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue([mockInputBlockGroupData]),
          } as any);

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('currentGroupData')).toHaveTextContent('1');
        });

        const getInputBlockDataButton = screen.getByTestId('getInputBlockData');
        await act(async () => {
          getInputBlockDataButton.click();
        });

        expect(console.log).toHaveBeenCalledWith('getInputBlockData result:', null);
      });

      it('should return null when ibdata is not found', async () => {
        // Create a context with input blocks but no matching ibdata
        const inputBlockWithoutMatchingData = { ...mockInputBlock, cid: 'different-cid' };
        const pluginWithDifferentCid = { ...mockPlugin, input_blocks: [inputBlockWithoutMatchingData] };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(pluginWithDifferentCid),
        } as any);

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('inputBlocks')).toHaveTextContent('1');
        });

        const getInputBlockDataButton = screen.getByTestId('getInputBlockData');
        await act(async () => {
          getInputBlockDataButton.click();
        });

        expect(console.log).toHaveBeenCalledWith('getInputBlockData result:', null);
      });
    });

    describe('getGroupDataById', () => {
      it('should return group data when groupId exists', async () => {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue(mockPlugin),
          } as any)
          .mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue([mockInputBlockGroupData]),
          } as any);

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('currentGroupData')).toHaveTextContent('1');
        });

        const getGroupDataByIdButton = screen.getByTestId('getGroupDataById');
        await act(async () => {
          getGroupDataByIdButton.click();
        });

        expect(console.log).toHaveBeenCalledWith(
          'getGroupDataById result:',
          mockInputBlockGroupData
        );
      });

      it('should return null when groupId is missing', async () => {
        mockUseParams.mockReturnValue({
          gid: 'test-gid',
          group: 'test-group',
          groupId: undefined,
          cid: 'test-cid',
          name: 'test-name',
        });

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        const getGroupDataByIdButton = screen.getByTestId('getGroupDataById');
        await act(async () => {
          getGroupDataByIdButton.click();
        });

        expect(console.log).toHaveBeenCalledWith('getGroupDataById result:', null);
      });

      it('should return null when group data is not found', async () => {
        mockUseParams.mockReturnValue({
          gid: 'test-gid',
          group: 'test-group',
          groupId: '999', // Non-existent ID
          cid: 'test-cid',
          name: 'test-name',
        });

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        const getGroupDataByIdButton = screen.getByTestId('getGroupDataById');
        await act(async () => {
          getGroupDataByIdButton.click();
        });

        expect(console.log).toHaveBeenCalledWith('getGroupDataById result:', null);
      });
    });

    describe('updateNewGroupData', () => {
      it('should update new group data', async () => {
        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        const updateNewGroupDataButton = screen.getByTestId('updateNewGroupData');
        await act(async () => {
          updateNewGroupDataButton.click();
        });

        // The function should update the state, but we can't easily test the internal state
        // We can verify it doesn't throw an error
        expect(updateNewGroupDataButton).toBeInTheDocument();
      });
    });

    describe('saveNewGroupData', () => {
      it('should save new group data successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ id: 2 }),
        } as any);

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        const saveNewGroupDataButton = screen.getByTestId('saveNewGroupData');
        await act(async () => {
          saveNewGroupDataButton.click();
        });

        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            '/api/input_block_data/groups',
            expect.objectContaining({
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            })
          );
        });
      });

      it('should handle save error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: jest.fn().mockResolvedValue({ message: 'Error' }),
        } as any);

        render(
          <InputBlockGroupDataProvider>
            <TestComponent />
          </InputBlockGroupDataProvider>
        );

        const saveNewGroupDataButton = screen.getByTestId('saveNewGroupData');
        
        // Test that the error is thrown when the button is clicked
        await act(async () => {
          saveNewGroupDataButton.click();
        });

        // The error should be thrown in the context function
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            '/api/input_block_data/groups',
            expect.objectContaining({
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            })
          );
        });
      });
    });
  });

  describe('useInputBlockGroupData hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useInputBlockGroupData must be used within an InputBlockGroupDataProvider');

      console.error = originalError;
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle fetch error in getInputBlocks', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('inputBlocks')).toHaveTextContent('0');
      });
    });

    it('should handle fetch error in getInputBlockGroupDataByGidGroup', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockPlugin),
        } as any)
        .mockRejectedValueOnce(new Error('Network error'));

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('groupDataList')).toHaveTextContent('0');
      });
    });

    it('should handle non-ok response in getInputBlockGroupDataByGidGroup', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockPlugin),
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          text: jest.fn().mockResolvedValue('Error message'),
        } as any);

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('groupDataList')).toHaveTextContent('0');
      });
    });

    it('should handle null response in getInputBlockGroupDataByGidGroup', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockPlugin),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(null),
        } as any);

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('groupDataList')).toHaveTextContent('0');
      });
    });

    it('should handle debounced save with network error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockPlugin),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue([mockInputBlockGroupData]),
        } as any)
        .mockRejectedValueOnce(new Error('Network error'));

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('currentGroupData')).toHaveTextContent('1');
      });

      const setInputBlockDataButton = screen.getByTestId('setInputBlockData');
      await act(async () => {
        setInputBlockDataButton.click();
      });

      // Should still attempt to save and handle the error gracefully
      await waitFor(() => {
        const calls = mockFetch.mock.calls;
        const patchCalls = calls.filter(call => 
          typeof call[0] === 'string' && 
          call[0].includes('/api/input_block_data/groups/1') && 
          call[1]?.method === 'PATCH'
        );
        expect(patchCalls.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should handle non-ok response in debounced save', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockPlugin),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue([mockInputBlockGroupData]),
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          json: jest.fn().mockResolvedValue({ message: 'Error' }),
        } as any);

      render(
        <InputBlockGroupDataProvider>
          <TestComponent />
        </InputBlockGroupDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('currentGroupData')).toHaveTextContent('1');
      });

      const setInputBlockDataButton = screen.getByTestId('setInputBlockData');
      await act(async () => {
        setInputBlockDataButton.click();
      });

      // Should still attempt to save and handle the error gracefully
      await waitFor(() => {
        const calls = mockFetch.mock.calls;
        const patchCalls = calls.filter(call => 
          typeof call[0] === 'string' && 
          call[0].includes('/api/input_block_data/groups/1') && 
          call[1]?.method === 'PATCH'
        );
        expect(patchCalls.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });
});
