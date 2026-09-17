import { isBackendConfigured, supabaseAdapter } from './supabase'
import { unconfiguredAdapter } from './unconfigured'
import type { BackendAdapter } from './backend'

/**
 * Provider selection lives in exactly one place. Adding another provider
 * means adding an adapter file and one line here.
 */
function selectAdapter(): BackendAdapter {
  if (isBackendConfigured()) return supabaseAdapter
  return unconfiguredAdapter
}

export const backend: BackendAdapter = selectAdapter()
export { isBackendConfigured } from './supabase'
export { BackendError, isBackendError } from './errors'
export { getRepoStars } from './github'
export type { BackendAdapter, SignUpInput, SignInInput } from './backend'
export { UNCONFIGURED_MESSAGE } from './backend'
