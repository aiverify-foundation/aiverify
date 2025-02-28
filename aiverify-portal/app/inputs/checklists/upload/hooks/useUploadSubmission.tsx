import { useMutation } from '@tanstack/react-query';

type ChecklistData = {
  [key: string]: string; // e.g., "completed-2.1.1": "Yes"
};

interface ChecklistSubmission {
  gid: string; // Group ID, e.g., "aiverify.stock.process_checklist"
  cid: string; // Checklist ID, e.g., "explainability_process_checklist"
  name: string; // Checklist name, e.g., "explainability_process_checklist"
  group: string; // Group name, e.g., "check a"
  data: ChecklistData; // Data related to the checklist
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

const submitChecklist = async (checklist: ChecklistSubmission) => {
  console.log('Final payload:', JSON.stringify(checklist, null, 2));
  const response = await fetch('/api/input_block_data', {
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

export function useChecklistSubmission() {
  const mutation = useMutation({
    mutationFn: submitChecklist,
  });

  return {
    submitChecklist: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error as SubmissionError | null,
  };
}
