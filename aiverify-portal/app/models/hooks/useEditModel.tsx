import { useMutation } from '@tanstack/react-query';
import { TestModel } from '@/app/models/utils/types';
import { toErrorWithMessage } from '@/lib/utils/error-utils';
import { processResponse } from '@/lib/utils/http-requests';

const updateModelDetails = async (
  updatedModel: TestModel
): Promise<TestModel> => {
  const response = await fetch(`/api/test_models/${updatedModel.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedModel),
  });

  const result = await processResponse<TestModel>(response);

  if (result instanceof Error) {
    throw toErrorWithMessage(result);
  }

  return result.data;
};

export const useEditModel = () => {
  return useMutation({
    mutationFn: updateModelDetails,
    onSuccess: () => {
      console.log('Changes saved successfully!');
    },
    onError: (error: Error) => {
      console.error(error.message);
    },
  });
};
