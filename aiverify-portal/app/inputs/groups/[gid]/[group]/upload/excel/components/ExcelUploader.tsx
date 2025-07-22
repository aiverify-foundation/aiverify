'use client';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { useInputBlockGroupSubmission } from '@/app/inputs/groups/[gid]/[group]/upload/hooks/useUploadSubmission';
import { Modal } from '@/lib/components/modal';
import { useMDXSummaryBundle } from '@/app/inputs/groups/[gid]/[group]/[groupId]/hooks/useMDXSummaryBundle';
import { EXPORT_PROCESS_CHECKLISTS_CID } from '@/app/inputs/groups/[gid]/[group]/[groupId]/hooks/useProcessChecklistExport';
import { excelToJson } from '../utils/excelToJson';
import styles from './ExcelUploader.module.css';
import { UploadIcon } from '@/app/models/upload/utils/icons';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';


// Define the interface for checklist submissions
interface ChecklistSubmission {
  gid: string;
  cid: string;
  name: string;
  group: string;
  data: Record<string, string>;
}

// Define an interface for the input block data structure
interface InputBlockData {
  id: string;
  gid: string;
  cid: string;
  group: string;
  data: Record<string, string>; // For other properties that may exist
}

// Define interface for API input blocks (simplified structure)
interface APIInputBlock {
  cid: string;
  data: Record<string, string>;
}

const ExcelUploader = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [duplicateSubmissions, setDuplicateSubmissions] = useState<
    ChecklistSubmission[]
  >([]);
  const [unmatchedSheets, setUnmatchedSheets] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [fileNameError, setFileNameError] = useState('');

  const { gid, group, groupDataList } = useInputBlockGroupData();

  // Preload the MDX bundle to ensure it's available
  const { error: mdxError } = useMDXSummaryBundle(
    gid,
    EXPORT_PROCESS_CHECKLISTS_CID
  );

  const { submitInputBlockGroup: submitChecklist } =
    useInputBlockGroupSubmission();
  const flow = searchParams.get('flow');
  const projectId = searchParams.get('projectId');

  const validateFileName = (fileName: string): boolean => {
    // Check file extension
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      setFileNameError('File must be in Excel format (.xlsx)');
      return false;
    }
    
    if (!fileName.endsWith('_checklists.xlsx')) {
      setFileNameError('File name must end with "_checklists.xlsx"');
      return false;
    }
    
    const groupNameFromFile = fileName
      .replace('.xlsx', '')
      .replace('_checklists', '');
    
    if (!groupNameFromFile.trim()) {
      setFileNameError('File name must start with a group name before "_checklists.xlsx"');
      return false;
    }
    
    setFileNameError('');
    return true;
  };

  const validateFile = (selectedFile: File): boolean => {
    // Check file name format
    if (!validateFileName(selectedFile.name)) {
      return false;
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (selectedFile.size > maxSize) {
      setFileNameError('File size exceeds 10MB limit');
      return false;
    }
    
    // Check if file is empty
    if (selectedFile.size === 0) {
      setFileNameError('File is empty or corrupted');
      return false;
    }
    
    // Check MIME type if available
    if (selectedFile.type && !selectedFile.type.includes('spreadsheet') && !selectedFile.type.includes('excel')) {
      setFileNameError('File does not appear to be a valid Excel file');
      return false;
    }
    
    return true;
  };

  // Quick test to validate Excel file structure before full processing
  const quickValidateExcelFile = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          if (!buffer || buffer.byteLength === 0) {
            console.warn('Quick validation failed: Empty buffer');
            resolve(false);
            return;
          }
          
          // Try to create a workbook to test file integrity
          const ExcelJS = await import('exceljs');
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          
          // Basic validation - check if it has sheets and they're readable
          if (!workbook.worksheets || workbook.worksheets.length === 0) {
            console.warn('Quick validation failed: No worksheets found');
            resolve(false);
            return;
          }
          
          // Try to access first sheet to ensure it's not corrupted
          const firstSheet = workbook.worksheets[0];
          if (!firstSheet || !firstSheet.name) {
            console.warn('Quick validation failed: First sheet is invalid');
            resolve(false);
            return;
          }

          // Additional corruption checks
          let totalCellsChecked = 0;
          let accessibleCells = 0;
          let validSheetCount = 0;
          const corruptedSheets: string[] = [];

          for (const worksheet of workbook.worksheets) {
            try {
              // Try to access basic sheet properties
              const sheetName = worksheet.name;
              const rowCount = worksheet.rowCount;
              const actualRowCount = worksheet.actualRowCount;
              
              console.log(`Checking sheet: ${sheetName}, rows: ${rowCount}/${actualRowCount}`);

              // Try to read some cells to test accessibility
              let cellTestCount = 0;
              let meaningfulContentCount = 0;
              for (let row = 1; row <= Math.min(10, actualRowCount); row++) {
                for (let col = 1; col <= 6; col++) {
                  try {
                    const cell = worksheet.getCell(row, col);
                    totalCellsChecked++;
                    // Try to access cell properties
                    const value = cell.value;
                    const text = cell.text;
                    
                    // Check if cell has meaningful content (not null, undefined, or empty string)
                    const hasContent = value !== null && 
                                     value !== undefined && 
                                     text !== null && 
                                     text !== undefined && 
                                     text.trim().length > 0;
                    
                    if (hasContent) {
                      meaningfulContentCount++;
                    }
                    
                    accessibleCells++;
                    cellTestCount++;
                  } catch (cellError) {
                    console.warn(`Cell access error at ${row},${col}:`, cellError);
                    totalCellsChecked++;
                  }
                }
              }

              // Check if this sheet has meaningful content
              const contentRatio = cellTestCount > 0 ? meaningfulContentCount / cellTestCount : 0;
              console.log(`Sheet ${sheetName}: ${meaningfulContentCount}/${cellTestCount} cells have meaningful content (${contentRatio.toFixed(2)} ratio)`);
              
              // A sheet is considered valid if it has at least some meaningful content
              if (contentRatio > 0.1) { // At least 10% of cells should have content
                validSheetCount++;
              } else {
                console.warn(`Sheet ${sheetName} has insufficient meaningful content (${contentRatio.toFixed(2)} ratio) - may be corrupted`);
                corruptedSheets.push(sheetName);
              }
            } catch (sheetError) {
              console.warn(`Sheet processing error for ${worksheet.name}:`, sheetError);
              corruptedSheets.push(worksheet.name);
            }
          }

          // Calculate corruption ratio
          const accessibilityRatio = totalCellsChecked > 0 ? accessibleCells / totalCellsChecked : 0;
          console.log(`Accessibility ratio: ${accessibilityRatio} (${accessibleCells}/${totalCellsChecked})`);
          
          // If less than 70% of cells are accessible, consider it corrupted
          if (accessibilityRatio < 0.7) {
            console.warn('Quick validation failed: Low cell accessibility ratio');
            resolve(false);
            return;
          }

          // Reject if ANY sheet is corrupted (has insufficient meaningful content)
          if (corruptedSheets.length > 0) {
            console.warn(`Quick validation failed: ${corruptedSheets.length} corrupted sheets detected: ${corruptedSheets.join(', ')}`);
            resolve(false);
            return;
          }

          // Need at least one valid sheet with meaningful content
          if (validSheetCount === 0) {
            console.warn('Quick validation failed: No sheets with meaningful content found');
            resolve(false);
            return;
          }
          
          console.log(`Quick validation passed: ${validSheetCount} valid sheets with meaningful content, ${accessibilityRatio.toFixed(2)} accessibility ratio`);
          resolve(true);
        } catch (error) {
          console.warn('Quick Excel validation failed:', error);
          resolve(false);
        }
      };
      
      reader.onerror = () => {
        console.warn('FileReader error during quick validation');
        resolve(false);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleBack = () => {
    if (flow && projectId) {
      router.push(
        `/inputs/groups/${encodeURI(gid)}/${encodeURI(group)}/upload?flow=${flow}&projectId=${projectId}`
      );
    } else {
      router.push(`/inputs/groups/${encodeURI(gid)}/${encodeURI(group)}`);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        setFile(null);
      }
    }
    
    // Clear the file input value to allow re-selecting the same file
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const overwriteChecklists = async () => {
    setIsConfirmModalVisible(false);
    setIsUploading(true);

    try {
      console.log(
        `Overwriting ${duplicateSubmissions.length} checklists for group "${groupName}"`
      );

      // Step 1: Fetch all existing input block data in a single request
      const response = await fetch('/api/input_block_data');
      if (!response.ok) {
        throw new Error(
          `Failed to fetch existing input block data: ${response.statusText}`
        );
      }

      const allInputBlockData = await response.json();
      console.log(
        `Retrieved ${allInputBlockData.length} existing input blocks`
      );

      // Step 2: Create a lookup map for faster matching by gid, cid, and group
      const inputBlockLookupMap = allInputBlockData.reduce(
        (map: Record<string, string>, item: InputBlockData) => {
          // Create a unique key combining gid, cid, and group
          const key = `${item.gid}|${item.cid}|${item.group}`;
          map[key] = item.id;
          return map;
        },
        {}
      );

      // Step 3: Process each submission with PUT request to update existing data
      for (const submission of duplicateSubmissions) {
        // Create the same unique key format for this submission
        const lookupKey = `${submission.gid}|${submission.cid}|${submission.group}`;
        const existingId = inputBlockLookupMap[lookupKey];

        if (existingId) {
          // Use PUT to update the existing checklist
          const updateResponse = await fetch(
            `/api/input_block_data/${existingId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(submission),
            }
          );

          if (!updateResponse.ok) {
            throw new Error(
              `Failed to update checklist ${submission.cid}: ${updateResponse.statusText}`
            );
          }

          console.log(
            `Successfully updated checklist ${submission.cid} with ID ${existingId}`
          );
        } else {
          console.warn(
            `No existing input block found for ${submission.cid} in group ${submission.group}`
          );
        }
      }

      let message = `Successfully overwritten ${duplicateSubmissions.length} checklists for group "${groupName}"!`;

      // Add information about unmatched sheets if any
      if (unmatchedSheets && unmatchedSheets.length > 0) {
        message += `\n\n${unmatchedSheets.length} sheet(s) did not exactly match any principle name and were not uploaded: ${unmatchedSheets.join(', ')}.\n\nSheet names must exactly match principle names (case-insensitive).`;
      }

      setModalMessage(message);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error during overwrite process:', error);
      setModalMessage(
        `Overwrite failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsModalVisible(true);
    } finally {
      setIsUploading(false);
      setDuplicateSubmissions([]);
    }
  };

  // Comprehensive validation function that must pass before any data is saved
  const validateSubmissionsForUpload = (submissions: ChecklistSubmission[]): { isValid: boolean; error?: string } => {
    console.log(`Validating ${submissions?.length || 0} submissions...`);
    
    if (!submissions || !Array.isArray(submissions)) {
      return { isValid: false, error: 'Invalid submission data structure' };
    }

    if (submissions.length === 0) {
      return { isValid: false, error: 'No valid checklist data found in the Excel file. Please ensure the file contains properly formatted checklist data with the correct structure (PID, Process, Metric, Process Checks columns must contain content).' };
    }

    // Log submission details for debugging
    console.log('Submission details:', submissions.map((s, i) => ({
      index: i,
      cid: s?.cid,
      gid: s?.gid,
      dataKeys: s?.data ? Object.keys(s.data).length : 0,
      hasContent: s?.data ? Object.keys(s.data).some(k => s.data[k] && String(s.data[k]).trim().length > 0) : false
    })));

    // Check for minimum data quality thresholds
    let totalDataPoints = 0;
    let meaningfulDataPoints = 0;

    // Validate each submission has required properties
    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      
      if (!submission || typeof submission !== 'object') {
        return { isValid: false, error: `Invalid submission structure found at position ${i + 1}.` };
      }
      
      if (!submission.cid || typeof submission.cid !== 'string' || submission.cid.trim().length === 0) {
        return { isValid: false, error: `Missing or invalid checklist ID (cid) in submission ${i + 1}.` };
      }
      
      if (!submission.gid || typeof submission.gid !== 'string' || submission.gid.trim().length === 0) {
        return { isValid: false, error: `Missing or invalid group ID (gid) in submission ${i + 1}.` };
      }
      
      if (!submission.data || typeof submission.data !== 'object') {
        return { isValid: false, error: `Missing or invalid data object in submission ${i + 1}.` };
      }
      
      // Check if data object has any meaningful content
      const dataKeys = Object.keys(submission.data);
      if (dataKeys.length === 0) {
        return { isValid: false, error: `Submission ${i + 1} contains no data. Please ensure the Excel file has completed checklist information.` };
      }

      // Count data quality
      dataKeys.forEach(key => {
        totalDataPoints++;
        const value = submission.data[key];
        if (value && typeof value === 'string' && value.trim().length > 0) {
          meaningfulDataPoints++;
        }
      });
      
      // Check if at least some data values are not empty for this submission
      const hasContent = dataKeys.some(key => {
        const value = submission.data[key];
        return value && typeof value === 'string' && value.trim().length > 0;
      });
      
      if (!hasContent) {
        return { isValid: false, error: `Submission ${i + 1} contains only empty data. Please ensure the Excel file has completed checklist information.` };
      }

      // Additional validation: check for suspicious data patterns that indicate corruption
      const suspiciousValues = dataKeys.filter(key => {
        const value = submission.data[key];
        // Check for null, undefined, or non-string values in critical fields
        return value === null || value === undefined || (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean');
      });

      if (suspiciousValues.length > dataKeys.length * 0.5) {
        return { isValid: false, error: `Submission ${i + 1} appears to have corrupted data with many invalid values.` };
      }

      // Check for checklist-like data patterns to ensure it's actually a checklist
      const checklistIndicators = dataKeys.filter(key => {
        const keyLower = key.toLowerCase();
        return keyLower.includes('completed') || 
               keyLower.includes('elaboration') || 
               keyLower.includes('justification') ||
               keyLower.includes('response') ||
               keyLower.includes('answer') ||
               keyLower.includes('pid');
      });

      // If we have no checklist-like patterns at all, this might be corrupted data
      if (checklistIndicators.length === 0) {
        return { isValid: false, error: `Submission ${i + 1} does not appear to contain valid checklist data. The Excel file may be corrupted or in the wrong format.` };
      }
    }

    // Global data quality check - be more lenient since structure is validated in Excel processing
    const dataQualityRatio = totalDataPoints > 0 ? meaningfulDataPoints / totalDataPoints : 0;
    console.log(`Data quality ratio: ${dataQualityRatio.toFixed(2)} (${meaningfulDataPoints}/${totalDataPoints})`);

    // Lower the threshold for data quality - allow more empty fields since structure is validated
    if (dataQualityRatio < 0.01) {
      return { isValid: false, error: `Data quality too low: Only ${(dataQualityRatio * 100).toFixed(1)}% of data fields contain meaningful content. This suggests the Excel file may be corrupted or in wrong format.` };
    }

    // Check for minimum total submissions
    if (submissions.length < 1) {
      return { isValid: false, error: `No valid submissions found. This may indicate a corrupted or incomplete Excel file.` };
    }

    console.log(`Validation passed: ${submissions.length} submissions, ${dataQualityRatio.toFixed(2)} data quality ratio`);
    return { isValid: true };
  };

  // Final validation before API calls
  const validateInputBlocksForAPI = (input_blocks: APIInputBlock[]): { isValid: boolean; error?: string } => {
    if (!input_blocks || !Array.isArray(input_blocks) || input_blocks.length === 0) {
      return { isValid: false, error: 'No valid input blocks to upload' };
    }

    for (let i = 0; i < input_blocks.length; i++) {
      const block = input_blocks[i];
      
      if (!block || typeof block !== 'object') {
        return { isValid: false, error: `Invalid input block structure at position ${i + 1}` };
      }
      
      if (!block.cid || typeof block.cid !== 'string') {
        return { isValid: false, error: `Invalid checklist ID in input block ${i + 1}` };
      }
      
      if (!block.data || typeof block.data !== 'object') {
        return { isValid: false, error: `Invalid data in input block ${i + 1}` };
      }
    }

    return { isValid: true };
  };

  const handleSubmit = async () => {
    if (!file) return;

    // Check if MDX bundle is available
    if (mdxError) {
      setModalMessage(
        `Error loading conversion functions: ${mdxError.message}`
      );
      setIsModalVisible(true);
      return;
    }

    // Basic file validation
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setModalMessage('Please upload a valid Excel file (.xlsx format only).');
      setIsModalVisible(true);
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setModalMessage('File size exceeds 10MB limit. Please upload a smaller file.');
      setIsModalVisible(true);
      return;
    }

    if (file.size === 0) {
      setModalMessage('The selected file is empty. Please upload a valid Excel file.');
      setIsModalVisible(true);
      return;
    }

    // Clear any previous error messages
    setFileNameError('');
    setIsUploading(true);

    try {
      // Quick validation to catch obviously corrupted files early
      console.log('Performing quick Excel file validation...');
      const isValidExcel = await quickValidateExcelFile(file);
      if (!isValidExcel) {
        throw new Error('The Excel file appears to be corrupted or invalid. Please check the file and try again.');
      }
      console.log('Quick validation passed');

      const fileGroupName = file.name
        .replace('.xlsx', '')
        .replace('_checklists', '');

      setGroupName(fileGroupName);

      console.log('Processing Excel file:', file.name);
      console.log('Using group name:', fileGroupName);

      // Add timeout to catch hung operations
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Upload timed out. The file may be too large or corrupted.'));
        }, 30000); // 30 second timeout
      });

      // PHASE 1: Process Excel file (no data saving yet)
      console.log('Phase 1: Processing Excel file...');
      const result = await Promise.race([
        excelToJson(file, fileGroupName, gid),
        timeoutPromise
      ]);

      console.log('Raw result from excelToJson:', result);

      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from file processing');
      }

      const { submissions, unmatchedSheets: unmatchedSheetsList } = result as {
        submissions: ChecklistSubmission[];
        unmatchedSheets: string[];
      };

      console.log(`Phase 1 complete: Got ${submissions?.length || 0} submissions, ${unmatchedSheetsList?.length || 0} unmatched sheets`);

      // PHASE 2: Comprehensive validation (before any data saving)
      console.log('Phase 2: Validating processed data...');
      const validationResult = validateSubmissionsForUpload(submissions);
      if (!validationResult.isValid) {
        console.error('Validation failed:', validationResult.error);
        throw new Error(validationResult.error || 'Validation failed');
      }
      console.log('Phase 2 complete: Data validation passed');

      // Store unmatched sheets for later use in messages
      setUnmatchedSheets(unmatchedSheetsList || []);

      // Prepare input blocks for API
      const input_blocks = submissions.map((x) => ({
        cid: x.cid,
        data: x.data,
      }));

      console.log('Prepared input_blocks:', input_blocks.map((block, i) => ({
        index: i,
        cid: block.cid,
        dataSize: Object.keys(block.data || {}).length
      })));

      // Validate input_blocks one more time
      if (!input_blocks || input_blocks.length === 0) {
        throw new Error('No valid input blocks created from Excel data');
      }

      // FINAL VALIDATION: Check input blocks right before API calls
      console.log('Final validation: Checking input blocks before API calls...');
      const finalValidation = validateInputBlocksForAPI(input_blocks);
      if (!finalValidation.isValid) {
        console.error('Final validation failed:', finalValidation.error);
        throw new Error(finalValidation.error || 'Final validation failed');
      }
      console.log('Final validation passed - safe to proceed with API calls');

      // Additional sanity check: Ensure we're not uploading empty or minimal data
      const totalDataFields = input_blocks.reduce((sum, block) => sum + Object.keys(block.data || {}).length, 0);
      const meaningfulFields = input_blocks.reduce((sum, block) => {
        return sum + Object.keys(block.data || {}).filter(key => {
          const value = block.data[key];
          return value && typeof value === 'string' && value.trim().length > 0;
        }).length;
      }, 0);

      console.log(`Sanity check: ${meaningfulFields}/${totalDataFields} meaningful data fields`);
      
      // Be more lenient - allow checklists with fewer meaningful fields since structure is validated
      // A valid checklist should have at least 1 meaningful field, but structure validation ensures quality
      if (meaningfulFields < 1) {
        throw new Error(`Insufficient meaningful data: No fields contain actual content. This indicates the Excel file may be corrupted or empty.`);
      }

      // Final checklist-specific validation
      const hasChecklistPatterns = submissions.some(submission => {
        const dataKeys = Object.keys(submission.data || {});
        // Look for common checklist field patterns
        const checklistIndicators = dataKeys.filter(key => {
          const keyLower = key.toLowerCase();
          return keyLower.includes('completed') || 
                 keyLower.includes('elaboration') || 
                 keyLower.includes('justification') ||
                 keyLower.includes('response') ||
                 keyLower.includes('answer') ||
                 keyLower.includes('pid');
        });
        return checklistIndicators.length > 0;
      });

      if (!hasChecklistPatterns) {
        throw new Error('The processed data does not appear to contain valid checklist information. The Excel file may be corrupted or in the wrong format.');
      }

      console.log('All validation checks passed - proceeding with upload');

      // PHASE 3: Save data (only after all validation passes)
      console.log('Phase 3: Saving validated data...');
      const found = groupDataList?.find((x) => x.name == fileGroupName);
      
      if (found) {
        // Update existing group
        const res = await fetch(`/api/input_block_data/groups/${found.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input_blocks,
          }),
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Server error while updating group: ${res.status} ${res.statusText}. ${errorText}`);
        }
        
        setModalMessage(`Upload Successful and overwrite ${fileGroupName}`);
        setIsModalVisible(true);
        
        if (!(flow && projectId)) {
          router.push(
            `/inputs/groups/${encodeURI(gid)}/${encodeURI(group)}/${found.id}`
          );
        }
      } else {
        // Create new group
        try {
          const res = await submitChecklist({
            gid: submissions[0].gid,
            name: fileGroupName,
            group,
            input_blocks,
          });
          
          // If we get here, the submission was successful
          // res contains the JSON response data, not a fetch response object
          setModalMessage('Upload Successful!');
          setIsModalVisible(true);
          
          if (res && res.id && !(flow && projectId)) {
            router.push(
              `/inputs/groups/${encodeURI(gid)}/${encodeURI(group)}/${res.id}`
            );
          }
        } catch (submitError) {
          // The submitChecklist function threw an error, which means it failed
          console.error('submitChecklist failed:', submitError);
          throw new Error(`Failed to create new checklist group: ${submitError instanceof Error ? submitError.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      console.error('Error during upload process:', error);
      
      // Handle different types of errors with user-friendly messages
      let errorMessage = 'Upload failed: ';
      
      if (error instanceof Error) {
        // Check for custom error types or known error patterns
        if (error.name === 'ExcelCorruptedError' || error.name === 'ExcelFileError' || error.name === 'ExcelFormatError') {
          errorMessage = error.message;
        } else if (error.message.includes('timed out') || error.message.includes('timeout')) {
          errorMessage = 'Upload timed out. The file may be too large or corrupted. Please try again with a smaller file.';
        } else if (error.message.includes('fetch') || error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('Cannot read properties of null')) {
          errorMessage = 'The Excel file appears to be corrupted or in an invalid format. Please check the file and try again.';
        } else if (error.message.includes('Invalid file format')) {
          errorMessage = 'Invalid Excel file format. Please ensure you are uploading a valid .xlsx file.';
        } else if (error.message.includes('No valid checklist data') || error.message.includes('Validation failed') || error.message.includes('Invalid submission')) {
          errorMessage = error.message;
        } else if (error.message.includes('Server error')) {
          errorMessage = `Server error occurred while saving the data: ${error.message}`;
        } else if (error.message.includes('useEffect')) {
          errorMessage = 'A technical error occurred during processing. Please refresh the page and try again.';
        } else {
          // For any other error, show a generic but helpful message
          errorMessage = `An error occurred while processing the Excel file: ${error.message}`;
        }
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      setModalMessage(errorMessage);
      setIsModalVisible(true);
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalVisible(false);
    setDuplicateSubmissions([]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      const droppedFile = files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      } else {
        setFile(null);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div
      className="relative mb-8 flex h-[calc(100vh-100px)] overflow-y-auto rounded-lg bg-secondary-950 pl-10 scrollbar-hidden"
      role="region"
      aria-label="Excel uploader container">
      {/* Upload Status Modal */}
      {isModalVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-label="upload status modal">
          <Modal
            bgColor="var(--color-primary-500)"
            textColor="white"
            onCloseIconClick={closeModal}
            enableScreenOverlay
            heading="Upload Excel File"
            height={300}>
            <p
              id="upload-confirmation-message"
              style={{ whiteSpace: 'pre-line' }}>
              {modalMessage}
            </p>
          </Modal>
        </div>
      )}

      {/* Confirmation Modal for Overwrite */}
      {isConfirmModalVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-label="overwrite confirmation modal">
          <Modal
            bgColor="var(--color-warning-500)"
            textColor="white"
            onCloseIconClick={closeConfirmModal}
            enableScreenOverlay
            heading="Duplicate Checklists Detected"
            height={250}
            primaryBtnLabel="Yes, Overwrite"
            secondaryBtnLabel="Cancel"
            onPrimaryBtnClick={overwriteChecklists}
            onSecondaryBtnClick={closeConfirmModal}>
            <div className="mb-4">
              <p>
                There is an existing group of checklists with the name &quot;
                {groupName}&quot;. Do you want to overwrite these checklists?
              </p>
            </div>
          </Modal>
        </div>
      )}

      <div className="mt-6 w-full">
        <div
          className="mb-8 flex items-center justify-between"
          role="banner"
          aria-label="Uploader header">
          <div className="flex items-center">
            <div
              onClick={handleBack}
              className="cursor-pointer">
              <Icon
                name={IconName.ArrowLeft}
                color="white"
                size={30}
                aria-label="Back to checklists"
              />
            </div>
            <h1
              className="ml-6 text-2xl font-semibold text-white"
              aria-label="upload excel header"
              aria-level={1}>
              Add New Checklists {'>'} Upload Excel File
            </h1>
          </div>
        </div>
        <div className="flex">
          <div
            className="mr-20 flex w-full flex-col"
            role="main"
            aria-label="File upload section">
            <div className="flex gap-4">
              <div className="flex-1">
                <h3>Before uploading...</h3>
                <p className="mb-6 text-[0.9rem] text-secondary-300">
                  Check that the Excel file meets the following requirements.
                </p>
                <div className="rounded-md border border-secondary-400 p-4 text-[0.8rem]">
                  <ul
                    className="list-none"
                    role="list"
                    aria-label="list of excel upload requirements">
                    <li role="listitem">
                      File Format:{' '}
                      <span className="text-secondary-300">.xlsx</span>
                    </li>
                    <li role="listitem">
                      File Size:{' '}
                      <span className="text-secondary-300">Less than 10MB</span>
                    </li>
                    <li role="listitem">
                      File Name:{' '}
                      <span className="text-secondary-300">
                        Must start with group name and end with
                        &apos;_checklists.xlsx&apos;
                      </span>
                    </li>
                    <li role="listitem">
                      Excel Sheet Names:{' '}
                      <span className="text-secondary-300">
                        Ensure that each sheet have the correct names as
                        follows, else it will not be uploaded: Transparency,
                        Explainability, Reproducibility, Safety, Security,
                        Robustness, Fairness, Data Governance, Accountability,
                        Human Agency & Oversight, Inclusive Growth, Societal & Environmental Well-being, Organisational
                        Considerations. Ensure that the Completed column is
                        filled with a Yes, No or Not Applicable, else it will be
                        a blank value. Note: Excel may truncate long sheet names due to the 31-character limit.
                      </span>
                    </li>
                    <li role="listitem">
                      Excel Sheet Content:{' '}
                      <span className="text-secondary-300">
                        Only content in the columns: Completed, Elaboration, and
                        the section for Summary Justification will be uploaded.
                        Ensure that the Completed column is filled with a Yes,
                        No or Not Applicable, else it will be a blank value.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div
                className={`${styles.dropzone} flex-1`}
                onClick={() => document.getElementById('fileInput')?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                role="button"
                aria-label="File drop zone">
                <input
                  type="file"
                  id="fileInput"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept=".xlsx"
                />
                <UploadIcon size={80} />
                <p className="mt-2 text-sm text-gray-300">
                  <span className="text-purple-400">Drag & drop</span> or{' '}
                  <span className="cursor-pointer text-purple-400">
                    Click to Browse
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Only Excel files are supported
                </p>
              </div>
            </div>

            {/* File name validation error */}
            {fileNameError && (
              <div className="mt-3 rounded-md border border-red-400 bg-red-50 p-3 text-red-700">
                <div className="flex items-center">
                  <span className="mr-2 text-lg">⚠️</span>
                  <span className="text-sm font-medium">Invalid file name:</span>
                </div>
                <p className="mt-1 text-sm">{fileNameError}</p>
                <p className="mt-1 text-xs text-red-600">
                  File name must follow the format: [group_name]_checklists.xlsx
                </p>
              </div>
            )}

            <h2 className="mb-2 mt-10 text-lg font-semibold">
              Selected Files:
            </h2>
            <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border-2 border-gray-400 p-4">
              {file && (
                <div className={styles.fileItem}>
                  <div className={styles.fileHeader}>
                    <div className={styles.fileName}>{file.name}</div>
                    <button
                      className={styles.removeButton}
                      onClick={() => setFile(null)}>
                      <Icon
                        name={IconName.Close}
                        color="white"
                      />
                    </button>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBar}
                      style={{
                        width: isUploading ? '100%' : '0%',
                        backgroundColor: isUploading ? 'green' : 'transparent',
                      }}
                    />
                  </div>
                  <span className={styles.fileStatus}>
                    {isUploading ? 'uploading' : 'ready'}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-auto mt-5 flex items-center">
              <Button
                className="mb-5 rounded-md border-none bg-primary-400 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:bg-secondary-900 disabled:text-secondary-600"
                size="sm"
                variant={ButtonVariant.PRIMARY}
                onClick={handleSubmit}
                disabled={isUploading || !file || !!fileNameError}
                text={isUploading ? 'UPLOADING...' : 'CONFIRM UPLOAD'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelUploader;
