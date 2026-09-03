import { BackendError } from './errors'
import { UNCONFIGURED_MESSAGE, type BackendAdapter } from './backend'

/**
 * Placeholder adapter used when no provider is configured (e.g. fresh clone).
 * Fails loudly and honestly — it never fakes success (§0.3-1).
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
}
