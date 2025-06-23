import { useState, useCallback } from 'react';
import { createAndDownloadExcel } from '../utils/excelExport';
import { executeMDXBundle } from './useMDXExecution';
import { useMDXSummaryBundle } from './useMDXSummaryBundle';

// Standardized CID that all plugins with export functionality must use
export const EXPORT_PROCESS_CHECKLISTS_CID = 'export_process_checklists';

// Define interface for checklist items
export interface Checklist {
  cid: string;
  name: string;
  group: string;
  data: Record<string, string>;
  // Use more specific index signature
  [key: string]: string | Record<string, string> | unknown;
}

// Define return type for export data
type ExportResult = Record<string, unknown> | boolean | null;

/**
 * A hook that provides functionality to export process checklists using the plugin
 * @param format The export format ('json' or 'xlsx')
 * @param groupName The name of the group to export
 * @param checklists The checklists to export
 * @param gid The plugin gid to use for the export
 * @returns An object with export functionality and state
 */
export function useProcessChecklistExport(
  format: string,
  groupName: string,
  checklists: Checklist[],
  gid: string
) {
  const [isExporting, setIsExporting] = useState(false);

  // Fetch the MDX export bundle
  const { data: mdxBundle, isLoading: isLoadingBundle } = useMDXSummaryBundle(
    gid,
    EXPORT_PROCESS_CHECKLISTS_CID
  );

  // Flag to track whether the export functionality is ready
  const isReady = !isLoadingBundle && !!mdxBundle?.code;

  // Function to export data based on the format
  const handleExport = useCallback(async (): Promise<ExportResult> => {
    if (!isReady || isExporting) return null;

    setIsExporting(true);
    try {
      if (!mdxBundle?.code) {
        throw new Error('MDX bundle not loaded');
      }

      // Execute the MDX bundle to get the exported functions
      const moduleExports = executeMDXBundle(mdxBundle);

      // Check if exportProcessChecklists function is exported from the MDX
      if (
        moduleExports &&
        typeof moduleExports.exportProcessChecklists === 'function'
      ) {
        // Use the exportProcessChecklists function from the module exports
        const result = await moduleExports.exportProcessChecklists(
          format,
          groupName,
          checklists
        );

        if (format.toLowerCase() === 'xlsx' && result) {
          // For Excel, create and download the file
          await createAndDownloadExcel(result);
          return true; // Return true to indicate success
        } else if (format.toLowerCase() === 'json') {
          // For JSON, return the data
          return result;
        } else {
          console.error('Unsupported export format or no data returned');
          return null;
        }
      } else {
        console.error(
          'exportProcessChecklists function not found in MDX bundle'
        );
        return null;
      }
    } catch (error) {
      console.error('Error during export:', error);
      return null;
    } finally {
      setIsExporting(false);
    }
  }, [isReady, isExporting, mdxBundle, format, groupName, checklists]);

  return {
    isExporting,
    isReady,
    handleExport,
  };
}
