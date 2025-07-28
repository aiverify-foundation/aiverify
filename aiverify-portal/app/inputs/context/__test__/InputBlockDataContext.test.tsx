import React from 'react';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { useParams, useSearchParams } from 'next/navigation';
import { InputBlockDataProvider, useInputBlockData } from '../InputBlockDataContext';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
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
  const context = useInputBlockData();
  return (
    <div>
      <div data-testid="gid">{context.gid || 'undefined'}</div>
      <div data-testid="cid">{context.cid || 'undefined'}</div>
      <div data-testid="id">{context.id || 'null'}</div>
      <div data-testid="data-keys">{Object.keys(context.data).length}</div>
      <div data-testid="data-content">{JSON.stringify(context.data)}</div>
      <button 
        data-testid="setData" 
        onClick={() => context.setData({ test: 'value', number: 42 })}
      >
        Set Data
      </button>
      <button 
        data-testid="setEmptyData" 
        onClick={() => context.setData({})}
      >
        Set Empty Data
      </button>
      <button 
        data-testid="setComplexData" 
        onClick={() => context.setData({ 
          nested: { key: 'value' }, 
          array: [1, 2, 3], 
          boolean: true 
        })}
      >
        Set Complex Data
      </button>
    </div>
  );
};

describe('InputBlockDataContext', () => {
  const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
  const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

  beforeEach(() => {
    // Default mock implementations
    mockUseParams.mockReturnValue({
      gid: 'test-gid',
      cid: 'test-cid',
    });

    const mockSearchParams = {
      get: jest.fn((key: string) => {
        if (key === 'id') return 'test-id';
        return null;
      }),
    } as any;
    mockUseSearchParams.mockReturnValue(mockSearchParams);
  });

  describe('InputBlockDataProvider', () => {
    it('should render children and provide context values', async () => {
      render(
        <InputBlockDataProvider>
          <TestComponent />
        </InputBlockDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('gid')).toHaveTextContent('test-gid');
        expect(screen.getByTestId('cid')).toHaveTextContent('test-cid');
        expect(screen.getByTestId('id')).toHaveTextContent('test-id');
        expect(screen.getByTestId('data-keys')).toHaveTextContent('0');
        expect(screen.getByTestId('data-content')).toHaveTextContent('{}');
      });
    });

    it('should handle missing gid and cid parameters', async () => {
      mockUseParams.mockReturnValue({
        gid: undefined,
        cid: undefined,
      });

      render(
        <InputBlockDataProvider>
          <TestComponent />
        </InputBlockDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('gid')).toHaveTextContent('undefined');
        expect(screen.getByTestId('cid')).toHaveTextContent('undefined');
      });
    });

    it('should handle missing id parameter', async () => {
      const mockSearchParams = {
        get: jest.fn((key: string) => null),
      } as any;
      mockUseSearchParams.mockReturnValue(mockSearchParams);

      render(
        <InputBlockDataProvider>
          <TestComponent />
        </InputBlockDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('id')).toHaveTextContent('null');
      });
    });

    it('should handle URL encoded parameters', async () => {
      mockUseParams.mockReturnValue({
        gid: 'test%20gid',
        cid: 'test%20cid',
      });

      render(
        <InputBlockDataProvider>
          <TestComponent />
        </InputBlockDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('gid')).toHaveTextContent('test%20gid');
        expect(screen.getByTestId('cid')).toHaveTextContent('test%20cid');
      });
    });

    it('should initialize with empty data object', async () => {
      render(
        <InputBlockDataProvider>
          <TestComponent />
        </InputBlockDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('data-keys')).toHaveTextContent('0');
        expect(screen.getByTestId('data-content')).toHaveTextContent('{}');
      });
    });
  });

  describe('Context Functions', () => {
    describe('setData', () => {
      it('should update data successfully', async () => {
        render(
          <InputBlockDataProvider>
            <TestComponent />
          </InputBlockDataProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('data-keys')).toHaveTextContent('0');
        });

        const setDataButton = screen.getByTestId('setData');
        await act(async () => {
          setDataButton.click();
        });

        await waitFor(() => {
          expect(screen.getByTestId('data-keys')).toHaveTextContent('2');
          expect(screen.getByTestId('data-content')).toHaveTextContent('"test":"value"');
          expect(screen.getByTestId('data-content')).toHaveTextContent('"number":42');
        });
      });

      it('should replace existing data completely', async () => {
        render(
          <InputBlockDataProvider>
            <TestComponent />
          </InputBlockDataProvider>
        );

        // First set some data
        const setDataButton = screen.getByTestId('setData');
        await act(async () => {
          setDataButton.click();
        });

        await waitFor(() => {
          expect(screen.getByTestId('data-keys')).toHaveTextContent('2');
        });

        // Then set different data
        const setComplexDataButton = screen.getByTestId('setComplexData');
        await act(async () => {
          setComplexDataButton.click();
        });

        await waitFor(() => {
          expect(screen.getByTestId('data-keys')).toHaveTextContent('3');
          expect(screen.getByTestId('data-content')).toHaveTextContent('"nested"');
          expect(screen.getByTestId('data-content')).toHaveTextContent('"array"');
          expect(screen.getByTestId('data-content')).toHaveTextContent('"boolean"');
          // Should not contain previous data
          expect(screen.getByTestId('data-content')).not.toHaveTextContent('"test":"value"');
        });
      });

      it('should handle empty data object', async () => {
        render(
          <InputBlockDataProvider>
            <TestComponent />
          </InputBlockDataProvider>
        );

        // First set some data
        const setDataButton = screen.getByTestId('setData');
        await act(async () => {
          setDataButton.click();
        });

        await waitFor(() => {
          expect(screen.getByTestId('data-keys')).toHaveTextContent('2');
        });

        // Then set empty data
        const setEmptyDataButton = screen.getByTestId('setEmptyData');
        await act(async () => {
          setEmptyDataButton.click();
        });

        await waitFor(() => {
          expect(screen.getByTestId('data-keys')).toHaveTextContent('0');
          expect(screen.getByTestId('data-content')).toHaveTextContent('{}');
        });
      });

      it('should handle complex nested data', async () => {
        render(
          <InputBlockDataProvider>
            <TestComponent />
          </InputBlockDataProvider>
        );

        const setComplexDataButton = screen.getByTestId('setComplexData');
        await act(async () => {
          setComplexDataButton.click();
        });

        await waitFor(() => {
          expect(screen.getByTestId('data-keys')).toHaveTextContent('3');
          expect(screen.getByTestId('data-content')).toHaveTextContent('"nested":{"key":"value"}');
          expect(screen.getByTestId('data-content')).toHaveTextContent('"array":[1,2,3]');
          expect(screen.getByTestId('data-content')).toHaveTextContent('"boolean":true');
        });
      });

      it('should handle null and undefined values in data', async () => {
        const TestComponentWithNullData: React.FC = () => {
          const context = useInputBlockData();
          return (
            <div>
              <div data-testid="data-content">{JSON.stringify(context.data)}</div>
              <button 
                data-testid="setNullData" 
                onClick={() => context.setData({ 
                  nullValue: null, 
                  undefinedValue: undefined,
                  emptyString: ''
                })}
              >
                Set Null Data
              </button>
            </div>
          );
        };

        render(
          <InputBlockDataProvider>
            <TestComponentWithNullData />
          </InputBlockDataProvider>
        );

        const setNullDataButton = screen.getByTestId('setNullData');
        await act(async () => {
          setNullDataButton.click();
        });

        await waitFor(() => {
          expect(screen.getByTestId('data-content')).toHaveTextContent('"nullValue":null');
          expect(screen.getByTestId('data-content')).toHaveTextContent('"emptyString":""');
          // undefined values are not serialized in JSON, so we check that the object has the expected structure
          expect(screen.getByTestId('data-content')).toHaveTextContent('{"nullValue":null,"emptyString":""}');
        });
      });
    });
  });

  describe('useInputBlockData hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useInputBlockData must be used within an InputBlockDataProvider');

      console.error = originalError;
    });

    it('should provide correct context structure', async () => {
      const TestContextStructure: React.FC = () => {
        const context = useInputBlockData();
        return (
          <div>
            <div data-testid="has-data">{typeof context.data === 'object' ? 'true' : 'false'}</div>
            <div data-testid="has-setData">{typeof context.setData === 'function' ? 'true' : 'false'}</div>
            <div data-testid="has-gid">{typeof context.gid === 'string' || context.gid === undefined ? 'true' : 'false'}</div>
            <div data-testid="has-cid">{typeof context.cid === 'string' || context.cid === undefined ? 'true' : 'false'}</div>
            <div data-testid="has-id">{typeof context.id === 'string' || context.id === null ? 'true' : 'false'}</div>
          </div>
        );
      };

      render(
        <InputBlockDataProvider>
          <TestContextStructure />
        </InputBlockDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('has-data')).toHaveTextContent('true');
        expect(screen.getByTestId('has-setData')).toHaveTextContent('true');
        expect(screen.getByTestId('has-gid')).toHaveTextContent('true');
        expect(screen.getByTestId('has-cid')).toHaveTextContent('true');
        expect(screen.getByTestId('has-id')).toHaveTextContent('true');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle large data objects', async () => {
      const TestLargeData: React.FC = () => {
        const context = useInputBlockData();
        return (
          <div>
            <div data-testid="data-keys">{Object.keys(context.data).length}</div>
            <button 
              data-testid="set-large-data" 
              onClick={() => {
                const largeData: { [key: string]: string } = {};
                for (let i = 0; i < 100; i++) {
                  largeData[`key${i}`] = `value${i}`;
                }
                context.setData(largeData);
              }}
            >
              Set Large Data
            </button>
          </div>
        );
      };

      render(
        <InputBlockDataProvider>
          <TestLargeData />
        </InputBlockDataProvider>
      );

      const setLargeDataButton = screen.getByTestId('set-large-data');
      await act(async () => {
        setLargeDataButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('data-keys')).toHaveTextContent('100');
      });
    });

    it('should handle multiple rapid setData calls', async () => {
      const TestRapidCalls: React.FC = () => {
        const context = useInputBlockData();
        return (
          <div>
            <div data-testid="data-content">{JSON.stringify(context.data)}</div>
            <button 
              data-testid="rapid-calls" 
              onClick={() => {
                context.setData({ first: 'value' });
                context.setData({ second: 'value' });
                context.setData({ third: 'value' });
              }}
            >
              Rapid Calls
            </button>
          </div>
        );
      };

      render(
        <InputBlockDataProvider>
          <TestRapidCalls />
        </InputBlockDataProvider>
      );

      const rapidCallsButton = screen.getByTestId('rapid-calls');
      await act(async () => {
        rapidCallsButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('data-content')).toHaveTextContent('"third":"value"');
        // Should only contain the last set data
        expect(screen.getByTestId('data-content')).not.toHaveTextContent('"first":"value"');
        expect(screen.getByTestId('data-content')).not.toHaveTextContent('"second":"value"');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple consumers of the same context', async () => {
      const Consumer1: React.FC = () => {
        const context = useInputBlockData();
        return (
          <div>
            <div data-testid="consumer1-data">{JSON.stringify(context.data)}</div>
            <button 
              data-testid="consumer1-set" 
              onClick={() => context.setData({ from: 'consumer1' })}
            >
              Set from Consumer 1
            </button>
          </div>
        );
      };

      const Consumer2: React.FC = () => {
        const context = useInputBlockData();
        return (
          <div>
            <div data-testid="consumer2-data">{JSON.stringify(context.data)}</div>
            <button 
              data-testid="consumer2-set" 
              onClick={() => context.setData({ from: 'consumer2' })}
            >
              Set from Consumer 2
            </button>
          </div>
        );
      };

      render(
        <InputBlockDataProvider>
          <Consumer1 />
          <Consumer2 />
        </InputBlockDataProvider>
      );

      // Set data from consumer 1
      const consumer1SetButton = screen.getByTestId('consumer1-set');
      await act(async () => {
        consumer1SetButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('consumer1-data')).toHaveTextContent('"from":"consumer1"');
        expect(screen.getByTestId('consumer2-data')).toHaveTextContent('"from":"consumer1"');
      });

      // Set data from consumer 2
      const consumer2SetButton = screen.getByTestId('consumer2-set');
      await act(async () => {
        consumer2SetButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('consumer1-data')).toHaveTextContent('"from":"consumer2"');
        expect(screen.getByTestId('consumer2-data')).toHaveTextContent('"from":"consumer2"');
      });
    });
  });
}); 