import { useQuery } from '@tanstack/react-query';

const fetchModelAPIData = async (id: string): Promise<any> => {
    try {
      const response = await fetch(`/api/test_models/exportModelAPI/${id}`); 
      const data = await response.json();
      console.log('Fetched model api data:', data); // Debugging line
      return data;
    } catch (error) {
      console.error('Error fetching model api data:', error);
      throw error;
    }
  };
  

export const useModelAPIData = (id: string) => {
  // Adjusting to useQuery's correct signature
  return useQuery({
    queryKey: ['model', id], // Query key to identify this query
    queryFn: () => fetchModelAPIData(id), // Query function to fetch data
    enabled: !!id, // Only run if id is truthy
  });
};
