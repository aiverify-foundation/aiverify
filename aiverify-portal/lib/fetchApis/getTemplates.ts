import { z } from 'zod';
import { ErrorWithMessage } from '@/app/errorTypes';
import { ReportTemplate } from '@/app/templates/types';
import { ApiResult, processResponse } from '@/lib/utils/fetchRequestHelpers';

export const TemplateSchema = z.object({});

export type TemplateSchemaType = z.infer<typeof TemplateSchema>;

export async function fetchTemplates(): Promise<
  ApiResult<ReportTemplate[]> | ErrorWithMessage
> {
  const response = await fetch('http://localhost:4000/project_templates');
  const result = await processResponse<ReportTemplate[]>(response);
  if ('message' in result) {
    return result;
  }

  // TODO: add zod parse error parse and return
  return result;
}
