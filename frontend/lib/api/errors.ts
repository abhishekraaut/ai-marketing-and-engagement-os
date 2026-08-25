export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'detail' in error &&
    typeof (error as Record<string, unknown>).detail === 'string'
  ) {
    return (error as Record<string, unknown>).detail as string;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as Record<string, unknown>).message as string;
  }

  return 'Something went wrong. Please try again.';
}
