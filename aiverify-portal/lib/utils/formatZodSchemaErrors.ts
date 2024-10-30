import { ZodError } from 'zod';

export function formatZodSchemaErrors(error: ZodError): {
  formStatus: 'error';
  formErrors: Record<string, string[]> | undefined;
} {
  const errorMap = error.flatten().fieldErrors;
  return {
    formStatus: 'error',
    formErrors: errorMap
      ? Object.entries(errorMap).reduce(
          (acc, [key, value]) => {
            acc[key] = value || [];
            return acc;
          },
          {} as Record<string, string[]>
        )
      : undefined,
  };
}
