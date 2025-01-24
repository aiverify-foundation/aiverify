import { z } from 'zod';
import { ErrorWithMessage } from '@/app/errorTypes';
import { Project } from '@/app/types';
import { ApiResult, processResponse } from '@/lib/utils/fetchRequestHelpers';

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  createdAt: z.string(),
  model: z.string(),
  status: z.string(),
});

export type ProjectSchemaType = z.infer<typeof ProjectSchema>;

export async function fetchProjects(): Promise<
  ApiResult<Project[]> | ErrorWithMessage
> {
  const response = await fetch(`http://localhost:3000/api/mock/projects`);
  const result = await processResponse<Project[]>(response);
  if ('message' in result) {
    return result;
  }
  // const projects = result.data.map((project) => ProjectSchema.parse(project));
  // TODO: add zod parse error parse and return
  return result;
}
