/* eslint-disable-next-line no-restricted-imports -- this file IS the Supabase adapter */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AuthProvider, Profile, SessionInfo } from '../types/domain'
import { BackendError } from './errors'
import { UNCONFIGURED_MESSAGE, type BackendAdapter } from './backend'

/**
 * Supabase adapter — the Phase-1 default provider (§3.1 [R]).
 * All provider access lives in src/services; features never import
 * '@supabase/supabase-js' directly (enforced by lint rule no-restricted-imports).
 */

const env = import.meta.env

export function isBackendConfigured(): boolean {
  return Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY)
}

function client(): SupabaseClient {
  if (!isBackendConfigured()) {
    // Fail loudly but human-readably (§0.3-6: no silent failures).
    throw new BackendError('provider_error', UNCONFIGURED_MESSAGE)
  }
  return createClient(env.VITE_SUPABASE_URL as string, env.VITE_SUPABASE_ANON_KEY as string, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

function mapUserToSession(user: { id: string; email?: string | null; email_confirmed_at?: string | null } | null): SessionInfo | null {
  if (!user) return null
  return {
    userId: user.id,
    email: user.email ?? null,
    emailVerified: Boolean(user.email_confirmed_at),
  }
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.user_id),
    handle: String(row.handle),
    displayName: String(row.display_name ?? row.handle),
    bio: String(row.bio ?? ''),
    avatarUrl: (row.avatar_url as string | null) ?? null,
    bannerUrl: (row.banner_url as string | null) ?? null,
    customStatus: (row.custom_status as string | null) ?? null,
    presence: 'online',
    joinedAt: String(row.created_at),
  }
}

const OAUTH_PROVIDER_MAP: Record<Exclude<AuthProvider, 'email'>, string> = {
  google: 'google',
  discord: 'discord',
  github: 'github',
}

export const supabaseAdapter: BackendAdapter = {
  name: 'supabase',

  auth: {
    async getSession() {
      const { data, error } = await client().auth.getSession()
      if (error) throw new BackendError('auth_invalid', error.message)
      return mapUserToSession(data.session?.user ?? null)
    },

    async signUp({ email, password }) {
      const { error } = await client().auth.signUp({ email, password })
      if (error) throw new BackendError(mapAuthCode(error.message), humanAuthMessage(error.message))
    },

    async signIn({ email, password }) {
      const { error } = await client().auth.signInWithPassword({ email, password })
      if (error) throw new BackendError(mapAuthCode(error.message), humanAuthMessage(error.message))
    },

    async signInWithOAuth(provider) {
      const { error } = await client().auth.signInWithOAuth({
        provider: OAUTH_PROVIDER_MAP[provider] as never,
        options: { redirectTo: window.location.origin },
      })
      if (error) throw new BackendError('provider_error', humanAuthMessage(error.message))
    },

    async signOut() {
      const { error } = await client().auth.signOut()
      if (error) throw new BackendError('server_error', 'Could not sign out. Try again.')
    },

    async requestPasswordReset(email) {
      const { error } = await client().auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      })
      if (error) throw new BackendError(mapAuthCode(error.message), humanAuthMessage(error.message))
    },
  },

  profiles: {
    async getByHandle(handle) {
      const { data, error } = await client()
        .from('profiles')
        .select('*')
        .eq('handle', handle)
        .maybeSingle()
      if (error) throw new BackendError('server_error', 'Could not load this profile. Retry in a moment.')
      return data ? mapProfile(data) : null
    },

    async updateOwn(patch) {
      const session = await supabaseAdapter.auth.getSession()
      if (!session) throw new BackendError('auth_required', 'Sign in to update your profile.')

      const dbPatch: Record<string, unknown> = {}
      if (patch.displayName !== undefined) dbPatch.display_name = patch.displayName
      if (patch.bio !== undefined) dbPatch.bio = patch.bio
      if (patch.customStatus !== undefined) dbPatch.custom_status = patch.customStatus
      if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl
      if (patch.bannerUrl !== undefined) dbPatch.banner_url = patch.bannerUrl

      const { data, error } = await client()
        .from('profiles')
        .update(dbPatch)
        .eq('user_id', session.userId)
        .select()
        .single()
      if (error) throw new BackendError('validation_failed', humanProfileMessage())
      return mapProfile(data)
    },
  },

  social: {
    async getFollowCounts(userId) {
      const [followers, following] = await Promise.all([
        countRows('follows', 'follower_id', 'followee_id', userId),
        countRows('follows', 'followee_id', 'follower_id', userId),
      ])
      return { followers, following }
    },

    async isFollowing(followerId, followeeId) {
      const { data, error } = await client()
        .from('follows')
        .select('follower_id')
        .eq('follower_id', followerId)
        .eq('followee_id', followeeId)
        .maybeSingle()
      if (error) throw new BackendError('server_error', 'Could not check the follow state. Retry in a moment.')
      return data !== null
    },

    async follow(targetUserId) {
      const session = await supabaseAdapter.auth.getSession()
      if (!session) throw new BackendError('auth_required', 'Sign in to follow people.')

      const { error } = await client().from('follows').insert({
        follower_id: session.userId,
        followee_id: targetUserId,
      })
      if (error) {
        // RLS already blocks following yourself (PK/check) and impersonation.
        const m = error.message.toLowerCase()
        if (m.includes('duplicate') || m.includes('unique constraint')) {
          throw new BackendError('conflict', 'You already follow them.')
        }
        throw new BackendError('forbidden', 'Could not follow right now. Try again in a moment.')
      }
    },

    async unfollow(targetUserId) {
      const session = await supabaseAdapter.auth.getSession()
      if (!session) throw new BackendError('auth_required', 'Sign in to unfollow people.')

      const { error } = await client()
        .from('follows')
        .delete()
        .eq('follower_id', session.userId)
        .eq('followee_id', targetUserId)
      if (error) throw new BackendError('server_error', 'Could not unfollow right now. Try again in a moment.')
    },
  },
}

/** HEAD count query against `table` filtered by `matchColumn = value`. */
async function countRows(table: string, selectColumn: string, matchColumn: string, value: string): Promise<number> {
  const { count, error } = await client()
    .from(table)
    .select(selectColumn, { count: 'exact', head: true })
    .eq(matchColumn, value)
  if (error) throw new BackendError('server_error', 'Could not load follow counts. Retry in a moment.')
  return count ?? 0
}

/** Maps Supabase auth messages to §3.3 codes. */
function mapAuthCode(message: string) {
  const m = message.toLowerCase()
  if (m.includes('already registered')) return 'conflict'
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'auth_invalid'
  if (m.includes('rate limit') || m.includes('too many') || m.includes('email rate limit')) return 'rate_limited'
  if (m.includes('password')) return 'validation_failed'
  if (m.includes('email not confirmed')) return 'auth_invalid'
  return 'server_error'
}

const AUTH_MESSAGES: Record<string, string> = {
  conflict: 'An account with this email already exists. Try signing in instead.',
  auth_invalid: 'Email or password is incorrect.',
  rate_limited: 'Too many attempts. Please wait a minute and try again.',
  validation_failed: 'That password does not meet the requirements.',
  server_error: 'Sign-in is having trouble right now. Please try again shortly.',
}

function humanAuthMessage(message: string): string {
  const code = mapAuthCode(message)
  if (code === 'validation_failed') {
    return 'Password must be at least 8 characters.'
  }
  return AUTH_MESSAGES[code]
}

function humanProfileMessage(): string {
  return 'Could not save your profile. Check the values and try again.'
}
