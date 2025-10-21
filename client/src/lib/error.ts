import axios from 'axios';

/**
 * Extracts error message from various error types
 * Handles AxiosError, Error, and unknown error types safely
 */
export function getErrorMessage(error: unknown, fallback = 'Ocorreu um erro inesperado'): string {
  // Handle AxiosError (from API calls)
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.response?.data?.error || error.message || fallback;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message || fallback;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Fallback for unknown error types
  return fallback;
}
