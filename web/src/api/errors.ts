import axios from 'axios';
import type { ProblemDetails } from './types';

const FALLBACK_MESSAGE = 'Não foi possível completar a operação. Tente novamente.';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ProblemDetails>(error)) {
    if (!error.response) {
      return 'Não foi possível conectar à API.';
    }

    const problem = error.response.data;
    const firstFieldError = problem?.errors ? Object.values(problem.errors).flat()[0] : undefined;
    return firstFieldError ?? problem?.detail ?? problem?.title ?? FALLBACK_MESSAGE;
  }

  return FALLBACK_MESSAGE;
}

export function getStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}
