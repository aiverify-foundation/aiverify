import { useQuery } from '@tanstack/react-query';

const fetchModelData = async (id: string): Promise<any> => {
    try {
        const response = await fetch(`/api/test_models/download/${id}`);
        console.log("reponse, ", response.ok)
        // Check if the response is a valid JSON
        if (!response.ok) {
            console.log('response: ', response)
            throw new Error(`Failed to fetch model data: ${response.statusText}`);
        }
        
        // Check if the response contains the expected content-disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        if (!contentDisposition || !contentDisposition.includes('attachment')) {
            throw new Error('Expected attachment but did not receive one.');
        }
  
      // Extract the filename from the content-disposition header
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (!filenameMatch || !filenameMatch[1]) {
        throw new Error('Filename could not be extracted from content-disposition.');
      }
  
      const filename = filenameMatch[1];
      const blob = await response.blob(); // Get the response body as a Blob
  
      return {
        filename,   // Return the filename
        blob,       // Return the Blob (binary data)
      };
    } catch (error) {
      console.error('Error fetching model data:', error);
      throw error;
    }
  };
  
  export const useModelData = (id: string) => {
    return useQuery({
      queryKey: ['model', id],
      queryFn: () => fetchModelData(id),
      enabled: !!id, // Ensure the query is only run if id exists
    });
  };
  