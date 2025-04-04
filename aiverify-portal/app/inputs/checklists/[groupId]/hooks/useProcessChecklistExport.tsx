import { RiDownloadLine } from '@remixicon/react';
import { useState, useCallback, useEffect } from 'react';
import { createAndDownloadExcel } from '@/app/inputs/checklists/[groupId]/utils/excelExport';
import { executeMDXBundle } from './useMDXExecution';
import { useMDXSummaryBundle } from './useMDXSummaryBundle';

// Define interface for checklist items
interface Checklist {
  cid: string;
  name: string;
  group: string;
  data: Record<string, string>;
  // Use more specific index signature
  [key: string]: string | Record<string, string> | unknown;
}

/**
 * A hook that provides functionality to export process checklists using the plugin
 * @param groupName The name of the group to export
 * @param checklists The checklists to export
 * @returns An object with export functionality and state
 */
export function useProcessChecklistExport(
  groupName: string,
  checklists: Checklist[]
) {
  const [isExporting, setIsExporting] = useState(false);
  const [ExportButton, setExportButton] = useState<React.ReactNode | null>(
    null
  );

  // Plugin IDs
  const gid = 'aiverify.stock.process_checklist';
  const cid = 'export_process_checklists';

  // Fetch the MDX export bundle
  const { data: mdxBundle, isLoading: isLoadingBundle } = useMDXSummaryBundle(
    gid,
    cid
  );

  // Flag to track whether the export functionality is ready
  const isReady = !isLoadingBundle && !!mdxBundle?.code;

  // Create the export button component and export function
  useEffect(() => {
    if (mdxBundle?.code) {
      try {
        // Execute the MDX bundle to get the exported functions
        const moduleExports = executeMDXBundle(mdxBundle);

        // Check if prepareExportData function is exported from the MDX
        if (
          moduleExports &&
          typeof moduleExports.prepareExportData === 'function'
        ) {
          // Create a custom export button that uses our Excel utility
          const CustomExportButton = () => {
            const handleExport = async () => {
              if (isExporting) return;

              setIsExporting(true);
              try {
                // Use the prepareExportData function directly from the module exports
                const workbookDefinition =
                  await moduleExports.prepareExportData(groupName, checklists);

                if (workbookDefinition) {
                  // Use our generic Excel utility to create and download the Excel file
                  await createAndDownloadExcel(workbookDefinition);
                } else {
                  console.error('Failed to prepare Excel workbook definition');
                }
              } catch (error) {
                console.error('Error during export:', error);
              } finally {
                setIsExporting(false);
              }
            };

            return (
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="hover:text-primary-500"
                title="Export checklists to Excel">
                <RiDownloadLine size={20} />
              </button>
            );
          };

          setExportButton(<CustomExportButton />);
        } else {
          console.error('prepareExportData function not found in MDX bundle');
          setExportButton(
            <button
              disabled={true}
              className="opacity-50 hover:text-primary-500"
              title="Export not available">
              <RiDownloadLine size={20} />
            </button>
          );
        }
      } catch (error) {
        console.error('Error executing MDX bundle:', error);
        setExportButton(null);
      }
    } else {
      setExportButton(null);
    }
  }, [mdxBundle, groupName, checklists, isExporting]);

  // Function to trigger the export programmatically
  const triggerExport = useCallback(() => {
    if (!isReady || isExporting) return;

    // Find the export button in the DOM
    const button = document.querySelector(
      '[data-export-button="true"] button'
    ) as HTMLElement;
    if (button) {
      button.click();
    } else {
      console.error('Export button not found in DOM');
    }
  }, [isReady, isExporting]);

  return {
    isExporting,
    isReady,
    ExportButton,
    triggerExport,
  };
}
