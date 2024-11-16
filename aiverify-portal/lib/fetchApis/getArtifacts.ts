export const getArtifacts = async (id: number, name: string) => {
    try {
      const response = await fetch(`/api/getArtifact?id=${id}&name=${name}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("response status: ", response.status)
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get artifact');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error getting artifact:', error);
      throw error;
    }
  };
  