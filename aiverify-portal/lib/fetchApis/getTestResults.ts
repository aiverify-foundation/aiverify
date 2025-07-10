import { TestResult } from '@/app/types';

const endpointUrl = `${process.env.APIGW_HOST}/test_results/`;

type Options = {
  id?: number;
};

export async function getTestResults(opts?: Options): Promise<TestResult[]> {
  let requestUrl = endpointUrl;
  if (opts && opts.id != undefined) {
    requestUrl = `${endpointUrl}/${opts.id}`;
  }
  const res = await fetch(requestUrl); //{ cache: 'force-cache' }

  if (!res.ok) {
    const responseText = await res.text();
    console.log(`Failed to fetch test results - ${responseText}`);
    throw new Error(`Failed to fetch test results - ${responseText}`);
  }

  return res.json();
}

export const deleteResult = async (id: number, name?: string) => {
  try {
    const response = await fetch(`/api/test_results/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: name ? JSON.stringify({ name }) : undefined,
    });

    console.log('Backend response status:', response.status);

    if (response.status === 200) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        const body = await response.text();
        if (body === '') {
          return { message: 'Result deleted successfully.' };
        }
        try {
          return JSON.parse(body);
        } catch {
          return { message: body };
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error response from backend:', errorData);
      throw new Error(errorData || 'Failed to delete result');
    }

    // Parse response only if content exists
    return response.status === 204 ? null : await response.json();
  } catch (error) {
    console.error('Error deleting result:', error);
    throw error;
  }
};

export const updateResultName = async (id: number, name: string) => {
  try {
    const response = await fetch(`/api/test_results/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to update result name');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating result name:', error);
    throw error; // Rethrow so the calling function can handle it
  }
};

export const getArtifacts = async (id: number, name: string) => {
  try {
    const response = await fetch(`/api/test_results/${id}/artifacts/${name}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch artifact: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type'); // Note: Always lowercase
    const contentDisposition =
      response.headers.get('content-disposition') || '';

    console.log('backend contentype:', contentType);
    console.log('backend contentdisposition:', contentDisposition);

    // Determine artifact type (binary or text)
    const isBinary =
      contentType?.startsWith('image/') || contentType === 'application/pdf';

    const artifactData = isBinary
      ? await response.blob()
      : await response.text();
    const filename =
      contentDisposition.split('filename=')?.[1]?.replace(/"/g, '') ||
      'unknown';

    return {
      name: filename,
      type: contentType, // Content type from headers
      data: artifactData, // Blob or text
    };
  } catch (error) {
    console.error('Error fetching artifact:', error);
    throw error;
  }
};
