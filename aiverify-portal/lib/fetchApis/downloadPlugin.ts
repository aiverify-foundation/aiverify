export const downloadPlugin= async (gid: string): Promise<Response> => {
    try {
      const response = await fetch(`/api/downloadPlugin?gid=${gid}`, {
        method: 'GET',
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to fetch plugin file:', errorData);
        throw new Error('Failed to fetch plugin file');
      }
  
      return response;
    } catch (error) {
      console.error('Error fetching plugin file:', error);
      throw error;
    }
  };
  