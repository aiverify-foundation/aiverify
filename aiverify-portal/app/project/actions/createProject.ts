'use server';
import { ZodError, z } from 'zod';
import { formatZodSchemaErrors } from '@/lib/utils/formatZodSchemaErrors';
import type { ProjectFormValues } from '../types';
import { FormState } from '@/app/types';

const projectFormSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty'),
  description: z.string(),
  reportTitle: z.string(),
  company: z.string(),
});

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

  const response = await fetch('http://localhost:4000/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newProjectData),
  });

  const responseBody = await response.json();
  const errors: string[] = [];
  if (responseBody.message) {
    errors.push(responseBody.message);
  } else if (responseBody.detail) {
    errors.push(responseBody.detail);
  }

  if (!response.ok || responseBody.success === false) {
    return {
      formStatus: 'error',
      formErrors: {
        error: (errors.length && errors) || ['An unknown error occurred'],
      },
    };
  }

  return {
    formStatus: 'success',
    formErrors: undefined,
    ...newProjectData,
  };
}
