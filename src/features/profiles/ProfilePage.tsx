import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useSession } from '../../hooks/useSession'
import { backend, BackendError, isBackendError } from '../../services'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { Link, navigate } from '../../app/router'
import { PostCard } from '../feed/PostCard'
import type { FollowCounts, Post, Profile, ReactionType } from '../../types/domain'

interface LoadedProfile {
  profile: Profile
  counts: FollowCounts
  /** The signed-in viewer follows this profile. */
  isFollowing: boolean
  /** This profile follows the signed-in viewer. */
  followsViewer: boolean
}

/**
 * Member profile (§7.2): public page for any handle, with follow/unfollow
 * (§7.4, one-way in this phase) for signed-in members. Server-side RLS is
 * authoritative — the follow button just drives it.
 */
export function ProfilePage({ handle }: { handle: string }) {
  const { session } = useSession()
  const showToast = useToast()

  const [loaded, setLoaded] = useState<LoadedProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [reactionTypes, setReactionTypes] = useState<ReactionType[]>([])
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<'follow' | 'unfollow' | null>(null)

  const load = useCallback(async () => {
    setError(null)
    setNotFound(false)
    setLoaded(null)
    try {
      const profile = await backend.profiles.getByHandle(handle)
      if (!profile) {
        setNotFound(true)
        return
      }
      const viewerId = session?.userId
      const isOwn = viewerId === profile.id

      const [counts, authorPosts, fetchedTypes, followStates] = await Promise.all([
        backend.social.getFollowCounts(profile.id),
        backend.posts.listByAuthor(profile.id).catch(() => []),
        backend.posts.getReactionTypes().catch(() => []),
        viewerId && !isOwn
          ? Promise.all([
              backend.social.isFollowing(viewerId, profile.id),
              backend.social.isFollowing(profile.id, viewerId),
            ])
          : Promise.resolve([false, false] as [boolean, boolean]),
      ])

      const [isFollowing, followsViewer] = followStates
      setLoaded({ profile, counts, isFollowing, followsViewer })
      setPosts(authorPosts)
      setReactionTypes(fetchedTypes)
    } catch (err) {
      setError(err instanceof BackendError ? err.message : 'Could not load this profile. Retry in a moment.')
    }
  }, [handle, session?.userId])

  useEffect(() => {
    void load()
  }, [load])

  const own = session !== null && loaded !== null && session.userId === loaded.profile.id

  async function onToggleFollow() {
    if (!loaded) return
    const wasFollowing = loaded.isFollowing
    const action = wasFollowing ? 'unfollow' : 'follow'
    setPendingAction(action)
    // Optimistic flip; counts adjust immediately, errors roll back via reload.
    setLoaded({
      ...loaded,
      isFollowing: !wasFollowing,
      counts: {
        followers: Math.max(loaded.counts.followers + (wasFollowing ? -1 : 1), 0),
        following: loaded.counts.following,
      },
    })
    try {
      if (wasFollowing) {
        await backend.social.unfollow(loaded.profile.id)
        showToast('success', `No longer following @${loaded.profile.handle}.`)
      } else {
        await backend.social.follow(loaded.profile.id)
        showToast('success', `Following @${loaded.profile.handle}.`)
      }
    } catch (err) {
      if (isBackendError(err)) showToast('error', err.message)
      else showToast('error', 'That did not go through — try again.')
      void load() // resync the true server state
    } finally {
      setPendingAction(null)
    }
  }

  async function handleDeletePost(postId: string) {
    const postToDelete = posts.find((p) => p.id === postId)
    if (!postToDelete) return

    setPosts((prev) => prev.filter((p) => p.id !== postId))
    try {
      await backend.posts.delete(postId)
      showToast('success', 'Ripple dissolved.')
    } catch (err) {
      setPosts((prev) => [postToDelete, ...prev])
      showToast('error', isBackendError(err) ? err.message : 'Could not delete post.')
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
      setPosts((prev) => prev.map((p) => (p.id === postId ? originalPost : p)))
      showToast('error', isBackendError(err) ? err.message : 'Could not update reaction.')
    }
  }

  async function onSignOut() {
    await backend.auth.signOut()
    navigate('/')
  }

  if (error) {
    return (
      <ProfileShell onSignOut={onSignOut} signedIn={session !== null}>
        <GlassCard className="profile-error">
          <p className="form-error" role="alert">
            {error}
          </p>
          <Button variant="primary" onClick={() => void load()}>
            <i className="fa-solid fa-rotate" aria-hidden="true" /> Retry
          </Button>
        </GlassCard>
      </ProfileShell>
    )
  }

  if (notFound) {
    return (
      <ProfileShell onSignOut={onSignOut} signedIn={session !== null}>
        <EmptyState
          icon={<i className="fa-solid fa-magnifying-glass" aria-hidden="true" />}
          title="No one by that name in the marsh."
          hint={
            <>
              @{handle} does not exist or left. <Link to={session ? '/feed' : '/'}>Head back.</Link>
            </>
          }
        />
      </ProfileShell>
    )
  }

  if (!loaded) {
    return (
      <ProfileShell onSignOut={onSignOut} signedIn={session !== null}>
        <div className="boot-screen" role="status" aria-live="polite">
          <p>Wading through the reeds…</p>
        </div>
      </ProfileShell>
    )
  }

  const { profile, counts } = loaded
  const initials = profile.handle.slice(0, 2).toUpperCase()
  const joined = formatJoined(profile.joinedAt)

  return (
    <ProfileShell onSignOut={onSignOut} signedIn={session !== null}>
      <div className="profile-wrap">
        <GlassCard className="profile-hero">
          <div className="profile-identity">
            {profile.avatarUrl ? (
              <img className="profile-avatar" src={profile.avatarUrl} alt="" />
            ) : (
              <div className="profile-avatar profile-avatar-fallback" aria-hidden="true">
                {initials}
              </div>
            )}
            <div className="profile-titles">
              <h1 className="profile-name">
                {profile.displayName}
                {own ? <span className="profile-badge">you</span> : null}
              </h1>
              <p className="profile-handle">@{profile.handle}</p>
              {profile.customStatus ? (
                <p className="profile-status">
                  <i className="fa-solid fa-feather-pointed" aria-hidden="true" /> {profile.customStatus}
                </p>
              ) : null}
            </div>
          </div>

          {profile.bio ? <p className="profile-bio">{profile.bio}</p> : null}

          <div className="profile-meta">
            <span title="Presence">
              <i className="fa-solid fa-circle profile-online" aria-hidden="true" /> online
            </span>
            <span title="Joined">
              <i className="fa-solid fa-water" aria-hidden="true" /> Waded in {joined}
            </span>
          </div>

          <div className="profile-actions">
            <div className="profile-stats" role="group" aria-label="Follow counts">
              <span className="profile-stat">
                <strong>{counts.followers}</strong> followers
              </span>
              <span className="profile-stat">
                <strong>{counts.following}</strong> following
              </span>
            </div>

            {own ? (
              <Button variant="ghost" onClick={() => navigate('/settings')}>
                <i className="fa-solid fa-user-pen" aria-hidden="true" /> Edit profile
              </Button>
            ) : session === null ? (
              <Link className="btn btn-ghost" to="/login">
                <i className="fa-solid fa-right-to-bracket" aria-hidden="true" /> Sign in to follow
              </Link>
            ) : (
              <Button
                variant={loaded.isFollowing ? 'ghost' : 'primary'}
                loading={pendingAction !== null}
                onClick={() => void onToggleFollow()}
                title={loaded.isFollowing ? `Unfollow @${profile.handle}` : `Follow @${profile.handle}`}
                aria-pressed={loaded.isFollowing}
              >
                {loaded.isFollowing ? (
                  <>
                    <i className="fa-solid fa-check" aria-hidden="true" /> Following
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plus" aria-hidden="true" /> Follow
                  </>
                )}
              </Button>
            )}
          </div>
          {!own && loaded.followsViewer ? (
            <p className="profile-follows-you">
              <i className="fa-solid fa-wave-square" aria-hidden="true" /> @{profile.handle} follows you
            </p>
          ) : null}
        </GlassCard>

        <section className="profile-posts-section" aria-label={`Ripples by @${profile.handle}`}>
          <h2 className="profile-posts-title">
            <i className="fa-solid fa-feather-pointed" aria-hidden="true" /> Ripples
          </h2>
          {posts.length === 0 ? (
            <EmptyState
              icon={<i className="fa-solid fa-water" aria-hidden="true" />}
              title="Still waters."
              hint={`@${profile.handle} hasn't released any ripples yet.`}
            />
          ) : (
            <div className="profile-posts-list" role="feed" aria-label="Member posts">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  reactionTypes={reactionTypes}
                  currentUserId={session?.userId}
                  onToggleReaction={handleToggleReaction}
                  onDelete={own ? handleDeletePost : undefined}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </ProfileShell>
  )
}

function ProfileShell({
  signedIn,
  onSignOut,
  children,
}: {
  signedIn: boolean
  onSignOut: () => void
  children: ReactNode
}) {
  return (
    <div className="app-shell">
      <nav className="app-nav glass" aria-label="Primary">
        <Link className="app-brand" to={signedIn ? '/feed' : '/'}>
          <i className="fa-solid fa-ghost app-brand-icon" aria-hidden="true" /> Hallowmarsh
        </Link>
        <div className="app-nav-actions">
          <Link className="btn btn-ghost" to="/feed">
            <i className="fa-solid fa-message" aria-hidden="true" /> Feed
          </Link>
          {signedIn ? (
            <button type="button" className="btn btn-ghost" onClick={() => void onSignOut()}>
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> Sign out
            </button>
          ) : null}
        </div>
      </nav>
      <main className="app-main">{children}</main>
    </div>
  )
}

function formatJoined(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'the mists'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
}
