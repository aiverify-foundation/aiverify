import { renderHook, act, waitFor } from '@testing-library/react';
import { useProcessChecklistExport, EXPORT_PROCESS_CHECKLISTS_CID, type Checklist } from '../useProcessChecklistExport';
import { createAndDownloadExcel } from '../../utils/excelExport';
import { executeMDXBundle } from '../useMDXExecution';
import { useMDXSummaryBundle } from '../useMDXSummaryBundle';

// Mock dependencies
jest.mock('../../utils/excelExport');
jest.mock('../useMDXExecution');
jest.mock('../useMDXSummaryBundle');

const mockCreateAndDownloadExcel = createAndDownloadExcel as jest.MockedFunction<typeof createAndDownloadExcel>;
const mockExecuteMDXBundle = executeMDXBundle as jest.MockedFunction<typeof executeMDXBundle>;
const mockUseMDXSummaryBundle = useMDXSummaryBundle as jest.MockedFunction<typeof useMDXSummaryBundle>;

// Mock MDXBundle interface
interface MDXBundle {
  code: string;
  frontmatter: Record<string, unknown>;
}

describe('useProcessChecklistExport', () => {
  const mockChecklists: Checklist[] = [
    {
      cid: 'test-cid-1',
      name: 'Test Checklist 1',
      group: 'Test Group',
      data: { key1: 'value1', key2: 'value2' },
    },
    {
      cid: 'test-cid-2',
      name: 'Test Checklist 2',
      group: 'Test Group',
      data: { key3: 'value3', key4: 'value4' },
    },
  ];

  const defaultProps = {
    format: 'json',
    groupName: 'Test Group',
    checklists: mockChecklists,
    gid: 'test-plugin',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockCreateAndDownloadExcel.mockResolvedValue(true);
    mockExecuteMDXBundle.mockReturnValue({
      exportProcessChecklists: jest.fn(),
    });
    mockUseMDXSummaryBundle.mockReturnValue({
      data: { code: 'mock-mdx-code', frontmatter: {} },
      isLoading: false,
    } as any);
  });

  describe('EXPORT_PROCESS_CHECKLISTS_CID constant', () => {
    it('should export the correct CID constant', () => {
      expect(EXPORT_PROCESS_CHECKLISTS_CID).toBe('export_process_checklists');
    });
  });

  describe('hook initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useProcessChecklistExport(
        defaultProps.format,
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      expect(result.current.isExporting).toBe(false);
      expect(result.current.isReady).toBe(true);
      expect(typeof result.current.handleExport).toBe('function');
    });

    it('should call useMDXSummaryBundle with correct parameters', () => {
      renderHook(() => useProcessChecklistExport(
        defaultProps.format,
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      expect(mockUseMDXSummaryBundle).toHaveBeenCalledWith(
        defaultProps.gid,
        EXPORT_PROCESS_CHECKLISTS_CID
      );
    });

    it('should set isReady to false when bundle is loading', () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: true,
      } as any);

      const { result } = renderHook(() => useProcessChecklistExport(
        defaultProps.format,
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      expect(result.current.isReady).toBe(false);
    });

    it('should set isReady to false when bundle has no code', () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: null, frontmatter: {} },
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useProcessChecklistExport(
        defaultProps.format,
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      expect(result.current.isReady).toBe(false);
    });

    it('should set isReady to true when bundle is loaded with code', () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: 'mock-mdx-code', frontmatter: {} },
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useProcessChecklistExport(
        defaultProps.format,
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      expect(result.current.isReady).toBe(true);
    });
  });

  describe('handleExport function', () => {
    it('should return null when not ready', async () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: true,
      } as any);

      const { result } = renderHook(() => useProcessChecklistExport(
        defaultProps.format,
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      let exportResult;
      await act(async () => {
        exportResult = await result.current.handleExport();
      });

      expect(exportResult).toBe(null);
      expect(mockExecuteMDXBundle).not.toHaveBeenCalled();
    });

    it('should return null when already exporting', async () => {
      const { result } = renderHook(() => useProcessChecklistExport(
        defaultProps.format,
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      // Start first export
      act(() => {
        result.current.handleExport();
      });

      // Try second export while first is still running
      let exportResult;
      await act(async () => {
        exportResult = await result.current.handleExport();
      });

      expect(exportResult).toBe(null);
    });

    it('should return null when not ready and already exporting', async () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: null,
        isLoading: true,
      } as any);

      const { result } = renderHook(() => useProcessChecklistExport(
        defaultProps.format,
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      // Manually set isExporting to true to test the combined condition
      act(() => {
        // Trigger the first call to set isExporting to true
        result.current.handleExport();
      });

      // Try second export while not ready and already exporting
      let exportResult;
      await act(async () => {
        exportResult = await result.current.handleExport();
      });

      expect(exportResult).toBe(null);
    });

    it('should proceed when ready and not exporting', async () => {
      const mockExportFunction = jest.fn().mockResolvedValue({ test: 'data' });
      mockExecuteMDXBundle.mockReturnValue({
        exportProcessChecklists: mockExportFunction,
      });

      const { result } = renderHook(() => useProcessChecklistExport(
        'json',
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      // This should proceed because isReady is true and isExporting is false
      let exportResult;
      await act(async () => {
        exportResult = await result.current.handleExport();
      });

      expect(exportResult).toEqual({ test: 'data' });
      expect(mockExportFunction).toHaveBeenCalled();
    });

    it('should throw error when MDX bundle has no code', async () => {
      mockUseMDXSummaryBundle.mockReturnValue({
        data: { code: null, frontmatter: {} },
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useProcessChecklistExport(
        defaultProps.format,
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      let exportResult;
      await act(async () => {
        exportResult = await result.current.handleExport();
      });

      expect(exportResult).toBe(null);
    });

    it('should handle error when executeMDXBundle throws', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockExecuteMDXBundle.mockImplementation(() => {
        throw new Error('MDX execution error');
      });

      const { result } = renderHook(() => useProcessChecklistExport(
        defaultProps.format,
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      let exportResult;
      await act(async () => {
        exportResult = await result.current.handleExport();
      });

      expect(exportResult).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error during export:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should handle error when moduleExports is null', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockExecuteMDXBundle.mockReturnValue(null);

      const { result } = renderHook(() => useProcessChecklistExport(
        defaultProps.format,
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      let exportResult;
      await act(async () => {
        exportResult = await result.current.handleExport();
      });

      expect(exportResult).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalledWith('exportProcessChecklists function not found in MDX bundle');

      consoleErrorSpy.mockRestore();
    });

    it('should handle error when exportProcessChecklists function is not found', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockExecuteMDXBundle.mockReturnValue({
        someOtherFunction: jest.fn(),
      });

      const { result } = renderHook(() => useProcessChecklistExport(
        defaultProps.format,
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      let exportResult;
      await act(async () => {
        exportResult = await result.current.handleExport();
      });

      expect(exportResult).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalledWith('exportProcessChecklists function not found in MDX bundle');

      consoleErrorSpy.mockRestore();
    });

    it('should handle error when exportProcessChecklists is not a function', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockExecuteMDXBundle.mockReturnValue({
        exportProcessChecklists: 'not a function',
      });

      const { result } = renderHook(() => useProcessChecklistExport(
        defaultProps.format,
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      let exportResult;
      await act(async () => {
        exportResult = await result.current.handleExport();
      });

      expect(exportResult).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalledWith('exportProcessChecklists function not found in MDX bundle');

      consoleErrorSpy.mockRestore();
    });

    it('should handle error when exportProcessChecklists is undefined', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockExecuteMDXBundle.mockReturnValue({
        someOtherFunction: jest.fn(),
        // exportProcessChecklists is undefined
      });

      const { result } = renderHook(() => useProcessChecklistExport(
        defaultProps.format,
        defaultProps.groupName,
        defaultProps.checklists,
        defaultProps.gid
      ));

      let exportResult;
      await act(async () => {
        exportResult = await result.current.handleExport();
      });

      expect(exportResult).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalledWith('exportProcessChecklists function not found in MDX bundle');

      consoleErrorSpy.mockRestore();
    });

    describe('JSON format export', () => {
      it('should return JSON data when format is json', async () => {
        const mockExportFunction = jest.fn().mockResolvedValue({ test: 'data' });
        mockExecuteMDXBundle.mockReturnValue({
          exportProcessChecklists: mockExportFunction,
        });

        const { result } = renderHook(() => useProcessChecklistExport(
          'json',
          defaultProps.groupName,
          defaultProps.checklists,
          defaultProps.gid
        ));

        let exportResult;
        await act(async () => {
          exportResult = await result.current.handleExport();
        });

        expect(mockExportFunction).toHaveBeenCalledWith('json', defaultProps.groupName, defaultProps.checklists);
        expect(exportResult).toEqual({ test: 'data' });
        expect(mockCreateAndDownloadExcel).not.toHaveBeenCalled();
      });

      it('should return JSON data when format is JSON (uppercase)', async () => {
        const mockExportFunction = jest.fn().mockResolvedValue({ test: 'data' });
        mockExecuteMDXBundle.mockReturnValue({
          exportProcessChecklists: mockExportFunction,
        });

        const { result } = renderHook(() => useProcessChecklistExport(
          'JSON',
          defaultProps.groupName,
          defaultProps.checklists,
          defaultProps.gid
        ));

        let exportResult;
        await act(async () => {
          exportResult = await result.current.handleExport();
        });

        expect(mockExportFunction).toHaveBeenCalledWith('JSON', defaultProps.groupName, defaultProps.checklists);
        expect(exportResult).toEqual({ test: 'data' });
      });

      it('should handle null result from exportProcessChecklists for JSON', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockExportFunction = jest.fn().mockResolvedValue(null);
        mockExecuteMDXBundle.mockReturnValue({
          exportProcessChecklists: mockExportFunction,
        });

        const { result } = renderHook(() => useProcessChecklistExport(
          'json',
          defaultProps.groupName,
          defaultProps.checklists,
          defaultProps.gid
        ));

        let exportResult;
        await act(async () => {
          exportResult = await result.current.handleExport();
        });

        expect(exportResult).toBe(null);
        // For JSON format, null result is returned directly without error logging
        expect(consoleErrorSpy).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });
    });

    describe('XLSX format export', () => {
      it('should create and download Excel file when format is xlsx', async () => {
        const mockExportFunction = jest.fn().mockResolvedValue({ test: 'data' });
        mockExecuteMDXBundle.mockReturnValue({
          exportProcessChecklists: mockExportFunction,
        });

        const { result } = renderHook(() => useProcessChecklistExport(
          'xlsx',
          defaultProps.groupName,
          defaultProps.checklists,
          defaultProps.gid
        ));

        let exportResult;
        await act(async () => {
          exportResult = await result.current.handleExport();
        });

        expect(mockExportFunction).toHaveBeenCalledWith('xlsx', defaultProps.groupName, defaultProps.checklists);
        expect(mockCreateAndDownloadExcel).toHaveBeenCalledWith({ test: 'data' });
        expect(exportResult).toBe(true);
      });

      it('should create and download Excel file when format is xlsx with truthy result', async () => {
        const mockExportFunction = jest.fn().mockResolvedValue(true);
        mockExecuteMDXBundle.mockReturnValue({
          exportProcessChecklists: mockExportFunction,
        });

        const { result } = renderHook(() => useProcessChecklistExport(
          'xlsx',
          defaultProps.groupName,
          defaultProps.checklists,
          defaultProps.gid
        ));

        let exportResult;
        await act(async () => {
          exportResult = await result.current.handleExport();
        });

        expect(mockExportFunction).toHaveBeenCalledWith('xlsx', defaultProps.groupName, defaultProps.checklists);
        expect(mockCreateAndDownloadExcel).toHaveBeenCalledWith(true);
        expect(exportResult).toBe(true);
      });

      it('should create and download Excel file when format is XLSX (uppercase)', async () => {
        const mockExportFunction = jest.fn().mockResolvedValue({ test: 'data' });
        mockExecuteMDXBundle.mockReturnValue({
          exportProcessChecklists: mockExportFunction,
        });

        const { result } = renderHook(() => useProcessChecklistExport(
          'XLSX',
          defaultProps.groupName,
          defaultProps.checklists,
          defaultProps.gid
        ));

        let exportResult;
        await act(async () => {
          exportResult = await result.current.handleExport();
        });

        expect(mockExportFunction).toHaveBeenCalledWith('XLSX', defaultProps.groupName, defaultProps.checklists);
        expect(mockCreateAndDownloadExcel).toHaveBeenCalledWith({ test: 'data' });
        expect(exportResult).toBe(true);
      });

      it('should handle null result from exportProcessChecklists for XLSX', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockExportFunction = jest.fn().mockResolvedValue(null);
        mockExecuteMDXBundle.mockReturnValue({
          exportProcessChecklists: mockExportFunction,
        });

        const { result } = renderHook(() => useProcessChecklistExport(
          'xlsx',
          defaultProps.groupName,
          defaultProps.checklists,
          defaultProps.gid
        ));

        let exportResult;
        await act(async () => {
          exportResult = await result.current.handleExport();
        });

        expect(exportResult).toBe(null);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Unsupported export format or no data returned');
        expect(mockCreateAndDownloadExcel).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should handle falsy result from exportProcessChecklists for XLSX', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockExportFunction = jest.fn().mockResolvedValue(false);
        mockExecuteMDXBundle.mockReturnValue({
          exportProcessChecklists: mockExportFunction,
        });

        const { result } = renderHook(() => useProcessChecklistExport(
          'xlsx',
          defaultProps.groupName,
          defaultProps.checklists,
          defaultProps.gid
        ));

        let exportResult;
        await act(async () => {
          exportResult = await result.current.handleExport();
        });

        expect(exportResult).toBe(null);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Unsupported export format or no data returned');
        expect(mockCreateAndDownloadExcel).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should handle error when createAndDownloadExcel throws', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockExportFunction = jest.fn().mockResolvedValue({ test: 'data' });
        mockExecuteMDXBundle.mockReturnValue({
          exportProcessChecklists: mockExportFunction,
        });
        mockCreateAndDownloadExcel.mockRejectedValue(new Error('Excel creation error'));

        const { result } = renderHook(() => useProcessChecklistExport(
          'xlsx',
          defaultProps.groupName,
          defaultProps.checklists,
          defaultProps.gid
        ));

        let exportResult;
        await act(async () => {
          exportResult = await result.current.handleExport();
        });

        expect(exportResult).toBe(null);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error during export:', expect.any(Error));

        consoleErrorSpy.mockRestore();
      });
    });

    describe('unsupported format', () => {
      it('should handle unsupported format', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockExportFunction = jest.fn().mockResolvedValue({ test: 'data' });
        mockExecuteMDXBundle.mockReturnValue({
          exportProcessChecklists: mockExportFunction,
        });

        const { result } = renderHook(() => useProcessChecklistExport(
          'pdf',
          defaultProps.groupName,
          defaultProps.checklists,
          defaultProps.gid
        ));

        let exportResult;
        await act(async () => {
          exportResult = await result.current.handleExport();
        });

        expect(exportResult).toBe(null);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Unsupported export format or no data returned');

        consoleErrorSpy.mockRestore();
      });

      it('should handle unsupported format with falsy result', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockExportFunction = jest.fn().mockResolvedValue(null);
        mockExecuteMDXBundle.mockReturnValue({
          exportProcessChecklists: mockExportFunction,
        });

        const { result } = renderHook(() => useProcessChecklistExport(
          'csv',
          defaultProps.groupName,
          defaultProps.checklists,
          defaultProps.gid
        ));

        let exportResult;
        await act(async () => {
          exportResult = await result.current.handleExport();
        });

        expect(exportResult).toBe(null);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Unsupported export format or no data returned');

        consoleErrorSpy.mockRestore();
      });
    });

    describe('state management', () => {
      it('should set isExporting to true during export and false after completion', async () => {
        const mockExportFunction = jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({ test: 'data' }), 100))
        );
        mockExecuteMDXBundle.mockReturnValue({
          exportProcessChecklists: mockExportFunction,
        });

        const { result } = renderHook(() => useProcessChecklistExport(
          'json',
          defaultProps.groupName,
          defaultProps.checklists,
          defaultProps.gid
        ));

        // Start export
        act(() => {
          result.current.handleExport();
        });

        // Check that isExporting is true during export
        expect(result.current.isExporting).toBe(true);

        // Wait for export to complete
        await waitFor(() => {
          expect(result.current.isExporting).toBe(false);
        });
      });

      it('should set isExporting to false even when export fails', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockExportFunction = jest.fn().mockRejectedValue(new Error('Export failed'));
        mockExecuteMDXBundle.mockReturnValue({
          exportProcessChecklists: mockExportFunction,
        });

        const { result } = renderHook(() => useProcessChecklistExport(
          'json',
          defaultProps.groupName,
          defaultProps.checklists,
          defaultProps.gid
        ));

        // Start export
        act(() => {
          result.current.handleExport();
        });

        // Wait for export to complete (even with error)
        await waitFor(() => {
          expect(result.current.isExporting).toBe(false);
        });

        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe('Checklist interface', () => {
    it('should accept checklist with all required properties', () => {
      const checklist: Checklist = {
        cid: 'test-cid',
        name: 'Test Checklist',
        group: 'Test Group',
        data: { key: 'value' },
        additionalProperty: 'additional value',
      };

      expect(checklist.cid).toBe('test-cid');
      expect(checklist.name).toBe('Test Checklist');
      expect(checklist.group).toBe('Test Group');
      expect(checklist.data).toEqual({ key: 'value' });
      expect(checklist.additionalProperty).toBe('additional value');
    });
  });
}); 