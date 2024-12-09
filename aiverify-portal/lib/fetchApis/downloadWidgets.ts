export const downloadWidgets = async (gid: string): Promise<Response> => {
  try {
    const response = await fetch(`/api/downloadWidgets?gid=${gid}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to fetch widget file:', errorData);
      throw new Error('Failed to fetch widget file');
    }

    return response; // Return the response for further processing in the component
  } catch (error) {
    console.error('Error fetching widget file:', error);
    throw error;
  }
};
