'use server';
import { redirect } from 'next/navigation';
import { ZodError, z } from 'zod';
import type { ProjectFormValues } from '@/app/project/types';
import { FormState, ProjectInfo } from '@/app/types';
import { UserFlows } from '@/app/userFlowsEnum';
import { processResponse } from '@/lib/utils/fetchRequestHelpers';
import { formatZodSchemaErrors } from '@/lib/utils/formatZodSchemaErrors';

const projectFormSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty'),
  description: z.string(),
  reportTitle: z.string(),
  company: z.string(),
});

const endpoint = `${process.env.APIGW_HOST}/projects`;

export async function createProject(
  prevState: FormState<ProjectFormValues>,
  formData: FormData
) {
  let newProjectData: z.infer<typeof projectFormSchema>;

  try {
    newProjectData = projectFormSchema.parse({
      name: formData.get('name'),
      description: formData.get('description'),
      reportTitle: formData.get('reportTitle'),
      company: formData.get('company'),
    });
  } catch (error) {
    return formatZodSchemaErrors(error as ZodError);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newProjectData),
  });

  const result = await processResponse<ProjectInfo>(response);
  const errors: string[] = [];
  if ('message' in result) {
    errors.push(result.message);
  }

  if (result.status === 'error') {
    return {
      formStatus: 'error',
      formErrors: {
        error: (errors.length && errors) || ['An unknown error occurred'],
      },
    };
  }

  redirect(
    `/templates?flow=${UserFlows.NewProject}&projectId=${result.data.id}`
  );
}
