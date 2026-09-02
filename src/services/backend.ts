/**
 * BackendAdapter — the ONLY seam between features and any provider (§3.1/§4.1).
 * Features import this interface, never Supabase/Firebase/whatever directly.
 * Swapping providers touches src/services only.
 */
import type { AuthProvider, Profile, SessionInfo } from '../types/domain'
import type { ErrorCode } from './errors'

export interface SignUpInput {
  email: string
  password: string
  handle: string
}

export interface SignInInput {
  email: string
  password: string
}

export interface AuthAdapter {
  /** Returns null when not signed in. */
  getSession(): Promise<SessionInfo | null>
  signUp(input: SignUpInput): Promise<void>
  signIn(input: SignInInput): Promise<void>
  signInWithOAuth(provider: Exclude<AuthProvider, 'email'>): Promise<void>
  signOut(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
}

export interface ProfileAdapter {
  getByHandle(handle: string): Promise<Profile | null>
  updateOwn(patch: Partial<Pick<Profile, 'displayName' | 'bio' | 'customStatus' | 'avatarUrl' | 'bannerUrl' | 'presence'>>): Promise<Profile>
}

export interface BackendAdapter {
  readonly name: string
  readonly auth: AuthAdapter
  readonly profiles: ProfileAdapter
}

/** Thrown (as BackendError) by the placeholder adapter until a provider is configured. */
export const UNCONFIGURED_CODE: ErrorCode = 'provider_error'
export const UNCONFIGURED_MESSAGE =
  'The backend is not configured yet. Add your Supabase URL and anon key to .env (see .env.example) and restart the dev server.'
