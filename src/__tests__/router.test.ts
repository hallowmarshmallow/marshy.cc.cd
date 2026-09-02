import { describe, it, expect } from 'vitest'
import { matchRoute } from '../app/router'
import { BackendError } from '../services/errors'

describe('router matching', () => {
  it('matches static routes', () => {
    expect(matchRoute('/', '/')).toEqual({})
    expect(matchRoute('/feed', '/feed')).toEqual({})
    expect(matchRoute('/feed', '/nope')).toBeNull()
  })

  it('extracts params', () => {
    expect(matchRoute('/u/:handle', '/u/marshy')).toEqual({ handle: 'marshy' })
    expect(matchRoute('/u/:handle', '/u/marshy/extra')).toBeNull()
  })

  it('decodes URI components in params', () => {
    expect(matchRoute('/u/:handle', '/u/marsh%20mallow')).toEqual({ handle: 'marsh mallow' })
  })
})

describe('BackendError', () => {
  it('maps codes to HTTP classes', () => {
    expect(new BackendError('forbidden', 'x').httpStatus).toBe(403)
    expect(new BackendError('rate_limited', 'x').httpStatus).toBe(429)
  })

  it('marks only transient codes retryable by default', () => {
    expect(new BackendError('rate_limited', 'x').retryable).toBe(true)
    expect(new BackendError('forbidden', 'x').retryable).toBe(false)
  })

  it('treats unknown thrown values as non-retryable server errors via toBackendError', async () => {
    const { toBackendError } = await import('../services/errors')
    const mapped = toBackendError(new Error('boom'))
    expect(mapped.code).toBe('server_error')
    expect(mapped.retryable).toBe(false)
  })
})
