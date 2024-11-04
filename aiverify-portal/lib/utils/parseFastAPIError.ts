export function parseFastAPIError(
  errors: FastAPIError[]
): Record<string, string[]> {
  const errorObject: Record<string, string[]> = {};

  errors.forEach((error) => {
    if (error.loc && error.loc.length > 1) {
      const fieldName = error.loc[1];
      errorObject[fieldName] = [error.msg];
    }
  });

  return errorObject;
}
