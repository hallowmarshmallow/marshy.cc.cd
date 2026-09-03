import { useCallback, useEffect, useState } from 'react'
import { useSession } from '../../hooks/useSession'
import { backend, isBackendError } from '../../services'
import { EmptyState } from '../../components/ui/EmptyState'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { Link, navigate } from '../../app/router'
import { PostComposer } from './PostComposer'
import { PostCard } from './PostCard'
import type { Post, Profile, ReactionType } from '../../types/domain'

const DEFAULT_REACTION_TYPES: ReactionType[] = [
  { key: 'like', label: 'Like', glyph: '👍', sort: 1 },
  { key: 'love', label: 'Love', glyph: '❤️', sort: 2 },
  { key: 'laugh', label: 'Laugh', glyph: '😄', sort: 3 },
  { key: 'interesting', label: 'Interesting', glyph: '🤔', sort: 4 },
  { key: 'support', label: 'Support', glyph: '🫂', sort: 5 },
]

export function FeedPage() {
  const { session } = useSession()
  const showToast = useToast()

  const [posts, setPosts] = useState<Post[]>([])
  const [reactionTypes, setReactionTypes] = useState<ReactionType[]>(DEFAULT_REACTION_TYPES)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const [fetchedPosts, fetchedTypes, ownProfile] = await Promise.all([
        backend.posts.listFeed({ limit: 50 }),
        backend.posts.getReactionTypes().catch(() => DEFAULT_REACTION_TYPES),
        backend.profiles.getOwn().catch(() => null),
      ])

      setPosts(fetchedPosts)
      if (fetchedTypes && fetchedTypes.length > 0) {
        setReactionTypes(fetchedTypes)
      }
      if (ownProfile) {
        setProfile(ownProfile)
      }
    } catch (err) {
      const msg = isBackendError(err) ? err.message : 'Could not load the feed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadFeed()
  }, [loadFeed])

  function handlePostCreated(newPost: Post) {
    setPosts((prev) => [newPost, ...prev])
  }

  async function handleDeletePost(postId: string) {
    const postToDelete = posts.find((p) => p.id === postId)
    if (!postToDelete) return

    // Optimistically remove
    setPosts((prev) => prev.filter((p) => p.id !== postId))

    try {
      await backend.posts.delete(postId)
      showToast('success', 'Ripple dissolved from the marsh.')
    } catch (err) {
      // Rollback
      setPosts((prev) => [postToDelete, ...prev])
      const msg = isBackendError(err) ? err.message : 'Could not delete post. Try again.'
      showToast('error', msg)
    }
  }

  async function handleToggleReaction(postId: string, reactionType: string) {
    const originalPost = posts.find((p) => p.id === postId)
    if (!originalPost) return

    const myReactions = originalPost.myReactions ?? []
    const wasReacted = myReactions.includes(reactionType)
    const nextMyReactions = wasReacted
      ? myReactions.filter((r) => r !== reactionType)
      : [...myReactions, reactionType]

    const breakdown = { ...(originalPost.reactionBreakdown ?? {}) }
    const currentTypeCount = breakdown[reactionType] ?? 0
    if (wasReacted) {
      if (currentTypeCount <= 1) delete breakdown[reactionType]
      else breakdown[reactionType] = currentTypeCount - 1
    } else {
      breakdown[reactionType] = currentTypeCount + 1
    }

    const nextReactionCount = Math.max(0, originalPost.reactionCount + (wasReacted ? -1 : 1))

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              myReactions: nextMyReactions,
              reactionBreakdown: breakdown,
              reactionCount: nextReactionCount,
            }
          : p
      )
    )

    try {
      await backend.posts.toggleReaction(postId, reactionType)
    } catch (err) {
      // Rollback
      setPosts((prev) => prev.map((p) => (p.id === postId ? originalPost : p)))
      const msg = isBackendError(err) ? err.message : 'Could not update reaction.'
      showToast('error', msg)
    }
  }

  async function onSignOut() {
    try {
      await backend.auth.signOut()
      navigate('/')
    } catch {
      navigate('/')
    }
  }

  return (
    <div className="app-shell">
      <nav className="app-nav glass" aria-label="Primary">
        <Link className="app-brand" to="/feed">
          <i className="fa-solid fa-ghost app-brand-icon" aria-hidden="true" /> Hallowmarsh
        </Link>
        <div className="app-nav-actions">
          {profile?.handle ? (
            <Link className="btn btn-ghost" to={`/u/${profile.handle}`} title="View your profile">
              <i className="fa-solid fa-user" aria-hidden="true" /> @{profile.handle}
            </Link>
          ) : session?.email ? (
            <span className="app-nav-email">{session.email}</span>
          ) : null}

          <Link className="btn btn-ghost" to="/settings" title="Settings">
            <i className="fa-solid fa-gear" aria-hidden="true" />
          </Link>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void onSignOut()}
            title="Sign out"
          >
            <i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> Sign out
          </button>
        </div>
      </nav>

      <main className="app-main">
        <div className="feed-container">
          <header className="feed-header">
            <div>
              <h1 className="feed-title">The Marsh</h1>
              <p className="feed-subtitle">Ripples, whispers, and sightings from the mist.</p>
            </div>
            <Button
              variant="ghost"
              loading={refreshing}
              onClick={() => void loadFeed(true)}
              title="Refresh feed"
              className="feed-refresh-btn"
            >
              <i className="fa-solid fa-rotate" aria-hidden="true" />
            </Button>
          </header>

          <PostComposer onPostCreated={handlePostCreated} userProfile={profile} />

          {loading ? (
            <div className="boot-screen feed-loading" role="status" aria-live="polite">
              <p>Listening to the reeds…</p>
            </div>
          ) : error ? (
            <GlassCard className="feed-error-card">
              <p className="form-error" role="alert">
                {error}
              </p>
              <Button variant="primary" onClick={() => void loadFeed()}>
                <i className="fa-solid fa-rotate" aria-hidden="true" /> Retry
              </Button>
            </GlassCard>
          ) : posts.length === 0 ? (
            <EmptyState
              icon={<i className="fa-solid fa-water" aria-hidden="true" />}
              title="The waters are still."
              hint="No ripples have reached you yet. Be the first to speak into the reeds above."
            />
          ) : (
            <div className="feed-stream" role="feed" aria-label="Community feed">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  reactionTypes={reactionTypes}
                  currentUserId={session?.userId}
                  onToggleReaction={handleToggleReaction}
                  onDelete={handleDeletePost}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
