import type { FileUpload } from '@/app/templates/types';

export type UploadRequestPayload = {
  fileUpload: FileUpload;
  onProgress: (progress: number) => void;
};

// Define a type for JSON data - could be enhanced with more specific structure if known
export type JsonData = Record<string, unknown>;

// For testing alternate approaches
const USE_FETCH_APPROACH = true; // Set to true to use fetch API instead of XMLHttpRequest

export async function uploadJsonFile({
  fileUpload,
  onProgress,
}: UploadRequestPayload): Promise<{ message: string }> {
  // First, extract the JSON content from the file
  try {
    const jsonContent = await readFileAsJson(fileUpload.file);
    console.log('Extracted JSON content:', jsonContent);

    // Now that we have the JSON content, send it to the API
    if (USE_FETCH_APPROACH) {
      console.log('Using fetch API approach with extracted JSON content');
      return uploadJsonWithFetch(jsonContent, onProgress);
    } else {
      console.log('Using XMLHttpRequest approach with extracted JSON content');
      return uploadJsonWithXhr(jsonContent, onProgress);
    }
  } catch (error) {
    console.error('Error extracting JSON content from file:', error);
    throw new Error(
      `Failed to extract JSON content: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Helper function to read file as JSON
export function readFileAsJson(file: File): Promise<JsonData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        if (event.target?.result) {
          const content = event.target.result as string;
          const parsedJson = JSON.parse(content);
          resolve(parsedJson);
        } else {
          reject(new Error('Failed to read file content'));
        }
      } catch (error) {
        reject(
          new Error(
            `Invalid JSON content: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file);
  });
}

// Fetch API implementation with direct JSON content
export async function uploadJsonWithFetch(
  jsonContent: JsonData,
  onProgress: (progress: number) => void
): Promise<{ message: string }> {
  try {
    console.log('Fetch API - Sending JSON content to /api/project_templates');

    // Create headers for JSON content
    const headers = {
      'Content-Type': 'application/json',
    };

    // Send the JSON content directly
    const response = await fetch('/api/project_templates/', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(jsonContent),
    });

    console.log('Fetch API - Response status:', response.status);

    // Handle the response
    if (response.ok) {
      onProgress(100); // No progress events in fetch, so set to 100% when done
      const data = await response.json();
      console.log('Fetch API - Response data:', data);
      return data;
    } else {
      // Handle error response
      const errorText = await response.text();
      console.error(`Fetch API - Error ${response.status}:`, errorText);

      try {
        // Try to parse as JSON if possible
        const errorJson = JSON.parse(errorText);
        console.error('Fetch API - Error response JSON:', errorJson);
      } catch {
        // Not JSON, use as is
      }

      throw new Error(
        `Fetch API - Request failed with status ${response.status}: ${errorText}`
      );
    }
  } catch (error) {
    console.error('Fetch API - Error:', error);
    throw error;
  }
}

// XMLHttpRequest implementation with direct JSON content
export async function uploadJsonWithXhr(
  jsonContent: JsonData,
  onProgress: (progress: number) => void
): Promise<{ message: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/project_templates');

    // Set JSON headers
    xhr.setRequestHeader('Content-Type', 'application/json');

    // Log request details
    console.log('XHR - Request URL:', '/api/project_templates');
    console.log('XHR - Request method:', 'POST');
    console.log('XHR - Content-Type:', 'application/json');
    console.log('XHR - JSON content size:', JSON.stringify(jsonContent).length);

    // Add event listener for request start
    xhr.addEventListener('loadstart', () => {
      console.log('XHR - Request sent');
    });

    // Track progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        console.log(`XHR - Upload progress: ${Math.round(percentComplete)}%`);
        onProgress(percentComplete);
      }
    };

    // Handle success
    xhr.onload = () => {
      console.log('XHR - Response status:', xhr.status);
      console.log('XHR - Response status text:', xhr.statusText);

      // Log all response headers
      console.log('XHR - Response headers:');
      const headers = xhr.getAllResponseHeaders().split('\r\n');
      headers.forEach((header) => {
        if (header) console.log(header);
      });

      if (xhr.status === 200) {
        try {
          console.log('XHR - Status 200: Successful upload');
          console.log('XHR - Response:', xhr.responseText);
          console.log(
            'XHR - Content-Type:',
            xhr.getResponseHeader('Content-Type')
          );

          // Check if the response is JSON before attempting to parse
          if (
            xhr.getResponseHeader('Content-Type')?.includes('application/json')
          ) {
            const response = JSON.parse(xhr.responseText);
            console.log('XHR - Parsed JSON response:', response);
            resolve(response);
          } else {
            console.error(
              'XHR - Expected JSON response but received different content type'
            );
            reject(
              new Error('Expected JSON response, but received something else')
            );
          }
        } catch (err) {
          console.error('XHR - Error during JSON parsing:', err);
          reject(new Error('Invalid JSON response from server'));
        }
      } else {
        // Error handling for non-200 status codes...
        console.error(`XHR - Error response ${xhr.status}: ${xhr.statusText}`);
        console.log('XHR - Error response body:', xhr.responseText);

        try {
          // Try to parse error response if it's JSON
          if (
            xhr.getResponseHeader('Content-Type')?.includes('application/json')
          ) {
            const errorResponse = JSON.parse(xhr.responseText);
            console.log('XHR - Parsed error response:', errorResponse);
          }
        } catch {
          console.error('XHR - Could not parse error response as JSON');
        }

        if (xhr.status === 422) {
          const errorMessage = `Validation error (422): ${xhr.responseText}`;
          console.error(errorMessage);

          // Log what could be causing the 422 error
          console.log('XHR - Common causes of 422 errors:');
          console.log('1. JSON schema might not match what the server expects');
          console.log('2. Missing required fields in the JSON');
          console.log('3. Values have incorrect types');
          console.log('4. Server validation rules are not being met');

          reject(new Error(errorMessage));
        } else if (xhr.status === 413) {
          const errorMessage = 'Body exceeded size limit';
          console.error(errorMessage);
          reject(new Error(errorMessage));
        } else if (xhr.status >= 500 && xhr.status < 600) {
          const errorMessage = `Server error (${xhr.status}): ${xhr.statusText || 'An unexpected error occurred.'}`;
          console.error(errorMessage);
          reject(new Error(errorMessage));
        } else {
          const errorMessage = `Unexpected error: ${xhr.statusText}`;
          console.error(errorMessage);
          reject(new Error(errorMessage));
        }
      }
    };

    // Handle error
    xhr.onerror = (event) => {
      console.error('XHR - Network error occurred:', event);
      reject(new Error('Network error'));
    };

    // Send the JSON data directly
    console.log('XHR - Sending JSON content...');
    xhr.send(JSON.stringify(jsonContent));
  });
}
