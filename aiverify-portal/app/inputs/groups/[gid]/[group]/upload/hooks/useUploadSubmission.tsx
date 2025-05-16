import { useMutation } from '@tanstack/react-query';
import { InputBlockDataPayload } from '@/app/types';

type InputBlockGroupDataChildSubmission = {
  cid: string;
  data: InputBlockDataPayload;
};
interface InputBlockGroupSubmission {
  gid: string; // Group ID, e.g., "aiverify.stock.process_checklist"
  name: string; // group name, e.g. "sample process checklist"
  group: string; // Checklist name, e.g., "explainability_process_checklist"
  input_blocks: InputBlockGroupDataChildSubmission[];
}

interface ValidationError {
  type: string;
  loc: string[];
  msg: string;
  input: string;
}

interface SubmissionError {
  message: string;
  details?: string | ValidationError[];
  statusCode?: number;
}

const submitInputBlockGroup = async (checklist: InputBlockGroupSubmission) => {
  console.log('Final payload:', JSON.stringify(checklist, null, 2));
  const response = await fetch('/api/input_block_data/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(checklist),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.log(errorData);

    throw {
      message: errorData.detail
        ? typeof errorData.detail === 'string'
          ? errorData.detail
          : 'Validation error occurred'
        : 'Failed to submit checklist',
      details: Array.isArray(errorData.detail) ? errorData.detail : undefined,
      statusCode: response.status,
    };
  }

  return response.json();
};

export function useInputBlockGroupSubmission() {
  const mutation = useMutation({
    mutationFn: submitInputBlockGroup,
  });

  return {
    submitInputBlockGroup: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error as SubmissionError | null,
  };
}
