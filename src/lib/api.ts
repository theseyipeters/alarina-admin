export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

// The admin API lives under /api/admin on the same server as the couples' API (VITE_API_URL).
export const API_BASE = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/admin`

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init
  const res = await fetch(`${API_BASE}${path}`, {
    // The API is on another origin, so the staff cookie has to be sent explicitly.
    credentials: 'include',
    ...rest,
    ...(json !== undefined && { body: JSON.stringify(json), headers: { 'Content-Type': 'application/json' } }),
  })

  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const error = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error
    const err = new ApiError(res.status, error?.code ?? 'error', error?.message ?? res.statusText, error?.details)
    // A session that ran out mid-use: let the app send the person back to sign in.
    if (res.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('admin:signed-out'))
    throw err
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', json: body ?? {} }),
}

/** Builds a query string, leaving out empty values and defaults. */
export function query(params: Record<string, string | number | boolean | undefined | null>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '' && v !== 'all') q.set(k, String(v))
  const s = q.toString()
  return s ? `?${s}` : ''
}
