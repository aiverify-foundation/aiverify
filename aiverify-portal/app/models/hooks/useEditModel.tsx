import { useMutation } from '@tanstack/react-query';
import { TestModel } from '@/app/models/utils/types';

const updateModelDetails = async (updatedModel: TestModel) => {
  const response = await fetch(`/api/test_models/${updatedModel.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedModel),
  });

  if (!response.ok) {
    const errorData = await response.json();

    // Process the error and return a formatted string directly
    if (errorData?.detail && Array.isArray(errorData.detail)) {
      const formattedError = errorData.detail
        .map((item: any) => {
          const location = item.loc?.join(' -> ') || 'unknown location';
          return `${item.msg} (Location: ${location})`;
        })
        .join(' ');
      throw new Error(formattedError);
    }

    // Fallback for non-structured errors
    throw new Error(
      errorData.message || 'An error occurred while updating the model.'
    );
  }

  return response.json();
};

export const useEditModel = () => {
  return useMutation({
    mutationFn: updateModelDetails,
    onSuccess: () => {
      console.log('Changes saved successfully!');
    },
    onError: (error: Error) => {},
  });
};
