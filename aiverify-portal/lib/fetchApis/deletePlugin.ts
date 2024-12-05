export const deletePlugin = async (id: number) => {
    try {
      const response = await fetch('/api/deletePlugin', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.log('response is', response)
        throw new Error(errorData.error || 'Failed to delete plugin');
      }
  
      // Parse response only if content exists
      return response.status === 204 ? null : await response.json();
    } catch (error) {
      console.error('Error deleting result:', error);
      throw error;
    }
  };
  