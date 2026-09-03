/**
 * Shared domain types — framework-agnostic (§3.2).
 * These mirror the Phase-1 entity subset of §6.1.
 */

export type Visibility = 'public' | 'friends' | 'group'

export type PresenceState = 'online' | 'away' | 'busy' | 'invisible'

export interface Profile {
  id: string
  handle: string
  displayName: string
  bio: string
  avatarUrl: string | null
  bannerUrl: string | null
  customStatus: string | null
  presence: PresenceState
  joinedAt: string
}

export interface ReactionType {
  key: string
  label: string
  glyph: string
  sort: number
}

export interface Post {
  id: string
  authorId: string
  author: Pick<Profile, 'handle' | 'displayName' | 'avatarUrl'>
  body: string
  visibility: Visibility
  mediaUrls: string[]
  createdAt: string
  editedAt: string | null
  deletedAt: string | null
  reactionCount: number
  commentCount: number
  myReactions?: string[]
  reactionBreakdown?: Record<string, number>
}

export interface FollowCounts {
  followers: number
  following: number
}

export type AuthProvider = 'google' | 'discord' | 'github' | 'email'

export interface SessionInfo {
  userId: string
  email: string | null
  emailVerified: boolean
}
