export const downloadAlgorithm = async (gid: string, cid: string): Promise<Response> => {
    try {
      const response = await fetch(`/api/downloadAlgorithm?gid=${gid}&cid=${cid}`, {
        method: 'GET',
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to fetch algorithm file:', errorData);
        throw new Error('Failed to fetch algorithm file');
      }
  
      return response;
    } catch (error) {
      console.error('Error fetching algorithm file:', error);
      throw error;
    }
  };
  