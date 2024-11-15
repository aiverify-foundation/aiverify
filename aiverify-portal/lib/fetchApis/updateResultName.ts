export const updateResultName = async (id: number, name: string) => {
    try {
      const response = await fetch('/api/editResult', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, name }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update result name');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error updating result name:', error);
      throw error; // Rethrow so the calling function can handle it
    }
  };
  