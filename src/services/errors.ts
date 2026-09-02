/**
 * Uniform error envelope (§3.3). Every adapter maps provider errors into
 * BackendError; UI renders `message` (human-readable) and honors `retryable`.
 * Internal detail (requestId etc.) is logged, never shown raw to users.
 */

export const ERROR_CODES = [
  'auth_required',
  'auth_invalid',
  'forbidden',
  'not_found',
  'validation_failed',
  'rate_limited',
  'conflict',
  'quota_exceeded',
  'provider_error',
  'server_error',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

const HTTP_CLASS: Record<ErrorCode, number> = {
  auth_required: 401,
  auth_invalid: 401,
  forbidden: 403,
  not_found: 404,
  validation_failed: 400,
  rate_limited: 429,
  conflict: 409,
  quota_exceeded: 402,
  provider_error: 502,
  server_error: 500,
}

export class BackendError extends Error {
  readonly code: ErrorCode
  readonly retryable: boolean
  readonly requestId?: string

  constructor(code: ErrorCode, message: string, opts?: { retryable?: boolean; requestId?: string }) {
    super(message)
    this.name = 'BackendError'
    this.code = code
    const TRANSIENT = code === 'rate_limited' || code === 'provider_error' || code === 'server_error'
    this.retryable = opts?.retryable ?? TRANSIENT
    this.requestId = opts?.requestId
  }

  /** HTTP status class this error maps to (used by future API routes/tests). */
  get httpStatus(): number {
    return HTTP_CLASS[this.code]
  }
}

export function isBackendError(e: unknown): e is BackendError {
  return e instanceof BackendError
}

export function toBackendError(e: unknown): BackendError {
  if (isBackendError(e)) return e
  // Unknown provider failure: log full detail, surface generic message.
  // Not marked retryable — an unclassified failure must not trigger auto-retry loops.
  console.error('[backend] unhandled provider error:', e)
  return new BackendError('server_error', 'Something went wrong. Please try again.', { retryable: false })
}
