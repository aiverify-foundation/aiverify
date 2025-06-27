import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorWithMessage } from '@/app/errorTypes';
import { ReportTemplate } from '@/app/templates/types';
import { ApiResult, processResponse } from '@/lib/utils/fetchRequestHelpers';

const endpointUrl = `${process.env.APIGW_HOST}/project_templates/`;

type Options = {
  id?: number;
};

export async function fetchTemplates(
  opts?: Options
): Promise<ApiResult<ReportTemplate[]> | ErrorWithMessage> {
  let requestUrl = endpointUrl;
  if (opts && opts.id != undefined) {
    requestUrl = `${endpointUrl}/${opts.id}`;
  }
  const response = await fetch(requestUrl);
  const result = await processResponse<ReportTemplate | ReportTemplate[]>(
    response
  );

  if (!('data' in result)) {
    return result;
  }

  // If we have data and an ID was provided, wrap the single template in an array
  if (opts?.id != undefined) {
    return {
      ...result,
      data: [result.data as ReportTemplate],
    };
  }

  // If no ID was provided, ensure we have an array
  return {
    ...result,
    data: Array.isArray(result.data)
      ? result.data
      : [result.data as ReportTemplate],
  };
}

/**
 * Hook to update a template
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      data,
    }: {
      templateId: number;
      data: Partial<ReportTemplate>;
    }) => {
      const response = await fetch(`/api/project_templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return processResponse<ReportTemplate>(response);
    },
    onSuccess: () => {
      // Invalidate and refetch templates query
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

/**
 * Hook to create a new template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ReportTemplate>) => {
      const response = await fetch('/api/project_templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await processResponse<ReportTemplate>(response);
      if (!('data' in result)) {
        throw new Error(result.message);
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch templates query
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

/**
 * Updates a template by its ID
 * @param templateId - The ID of the template to update
 * @param data - The data to update the template with
 * @returns A promise resolving to an ApiResult containing the updated ReportTemplate, or an ErrorWithMessage if an error occurs
 */
export async function patchTemplate(
  templateId: number,
  data: Partial<ReportTemplate>
): Promise<ApiResult<ReportTemplate> | ErrorWithMessage> {
  const response = await fetch(`/api/project_templates/${templateId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return processResponse<ReportTemplate>(response);
}

/**
 * Creates a new template (server-side)
 * @param data - The data to create the template with
 * @returns A promise resolving to an ApiResult containing the created ReportTemplate, or an ErrorWithMessage if an error occurs
 */
export async function createTemplate(
  data: Partial<ReportTemplate>
): Promise<ApiResult<ReportTemplate> | ErrorWithMessage> {
  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return processResponse<ReportTemplate>(response);
}
