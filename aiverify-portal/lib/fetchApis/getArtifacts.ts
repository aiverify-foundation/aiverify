export const getArtifacts = async (id: number, name: string) => {
  try {
    const response = await fetch(`/api/getArtifact?id=${id}&name=${name}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch artifact: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type'); // Note: Always lowercase
    const contentDisposition =
      response.headers.get('content-disposition') || '';

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
