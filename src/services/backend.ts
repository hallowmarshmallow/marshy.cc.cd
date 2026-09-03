/**
 * BackendAdapter — the ONLY seam between features and any provider (§3.1/§4.1).
 * Features import this interface, never Supabase/Firebase/whatever directly.
 * Swapping providers touches src/services only.
 */
import type { AuthProvider, FollowCounts, Post, Profile, ReactionType, SessionInfo, Visibility } from '../types/domain'
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

export interface CreatePostInput {
  body: string
  visibility?: Visibility
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
  getOwn(): Promise<Profile | null>
  getByHandle(handle: string): Promise<Profile | null>
  updateOwn(patch: Partial<Pick<Profile, 'displayName' | 'bio' | 'customStatus' | 'avatarUrl' | 'bannerUrl' | 'presence'>>): Promise<Profile>
}

/**
 * Social graph (§7.4): one-way follows in Phase 1/2; mutual friendships
 * arrive as a separate table in a later phase. Server-side RLS enforces
 * that follow edges can only be created/deleted by their owner.
 */
export interface SocialAdapter {
  /** Followers + following counts for one profile (public reads). */
  getFollowCounts(userId: string): Promise<FollowCounts>
  /** Whether `followerId` currently follows `followeeId`. */
  isFollowing(followerId: string, followeeId: string): Promise<boolean>
  /** The signed-in user starts following `targetUserId`. */
  follow(targetUserId: string): Promise<void>
  /** The signed-in user stops following `targetUserId`. */
  unfollow(targetUserId: string): Promise<void>
}

/**
 * Posts & Feed (§17, Phase 2):
 * Reverse-chronological feed respecting RLS (public posts, followed friends, own posts).
 * Registry-driven reactions (§7.5) with atomic trigger-maintained counts.
 */
export interface PostsAdapter {
  /** List feed posts in reverse chronological order. */
  listFeed(options?: { limit?: number }): Promise<Post[]>
  /** List posts by a specific user (for profile page). */
  listByAuthor(authorId: string, options?: { limit?: number }): Promise<Post[]>
  /** Create a post (1-2000 chars, public or friends). */
  create(input: CreatePostInput): Promise<Post>
  /** Soft-delete or remove a post. Author or moderator only. */
  delete(postId: string): Promise<void>
  /** Toggle reaction on a post for the authenticated user. */
  toggleReaction(postId: string, reactionType: string): Promise<{ reacted: boolean }>
  /** Active reaction types from the registry. */
  getReactionTypes(): Promise<ReactionType[]>
}

export interface BackendAdapter {
  readonly name: string
  readonly auth: AuthAdapter
  readonly profiles: ProfileAdapter
  readonly social: SocialAdapter
  readonly posts: PostsAdapter
}

/** Thrown (as BackendError) by the placeholder adapter until a provider is configured. */
export const UNCONFIGURED_CODE: ErrorCode = 'provider_error'
export const UNCONFIGURED_MESSAGE =
  'The backend is not configured yet. Add your Supabase URL and anon key to .env (see .env.example) and restart the dev server.'
