import { BackendError } from './errors'
import { UNCONFIGURED_MESSAGE, type BackendAdapter } from './backend'

/**
 * Adapter used when no provider is configured, for example on a fresh clone.
 * It throws rather than faking success.
 */
async function unconfigured(): Promise<never> {
  throw new BackendError('provider_error', UNCONFIGURED_MESSAGE)
}

export const unconfiguredAdapter: BackendAdapter = {
  name: 'unconfigured',
  auth: {
    getSession: async () => null,
    signUp: unconfigured,
    signIn: unconfigured,
    signInWithOAuth: unconfigured,
    signOut: unconfigured,
    requestPasswordReset: unconfigured,
  },
  profiles: {
    getOwn: unconfigured,
    getByHandle: unconfigured,
    updateOwn: unconfigured,
  },
  social: {
    getFollowCounts: unconfigured,
    isFollowing: unconfigured,
    follow: unconfigured,
    unfollow: unconfigured,
  },
  posts: {
    listFeed: unconfigured,
    listByAuthor: unconfigured,
    create: unconfigured,
    delete: unconfigured,
    toggleReaction: unconfigured,
    getReactionTypes: unconfigured,
  },
  projects: {
    listPublished: unconfigured,
    listAll: unconfigured,
    create: unconfigured,
    update: unconfigured,
    remove: unconfigured,
  },
  roles: {
    // No session means no roles, the same way getSession resolves to null.
    isOwner: async () => false,
  },
  storage: {
    uploadImage: unconfigured,
  },
}
