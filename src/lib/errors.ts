import { ApiError } from './api.ts'

type Details = { fieldErrors?: Record<string, string[]> }

export function errorMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.code === 'validation_error') {
      const first = Object.values((err.details as Details | undefined)?.fieldErrors ?? {})[0]?.[0]
      return first ?? 'Check the details you entered.'
    }
    return err.message
  }
  return 'Could not reach the server. Check your connection and try again.'
}
