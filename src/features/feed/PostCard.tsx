import { useState } from 'react'
import { Link } from '../../app/router'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import type { Post, ReactionType } from '../../types/domain'

interface PostCardProps {
  post: Post
  reactionTypes: ReactionType[]
  currentUserId?: string | null
  onToggleReaction: (postId: string, reactionType: string) => Promise<void>
  onDelete?: (postId: string) => Promise<void>
}

export function PostCard({
  post,
  reactionTypes,
  currentUserId,
  onToggleReaction,
  onDelete,
}: PostCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reactingType, setReactingType] = useState<string | null>(null)

  const isAuthor = Boolean(currentUserId && currentUserId === post.authorId)
  const initials = post.author.handle.slice(0, 2).toUpperCase()
  const timeAgo = formatTimeAgo(post.createdAt)
  const myReactions = post.myReactions ?? []

  async function handleToggleReaction(typeKey: string) {
    if (!currentUserId || reactingType) return
    setReactingType(typeKey)
    try {
      await onToggleReaction(post.id, typeKey)
    } finally {
      setReactingType(null)
    }
  }

  async function handleDelete() {
    if (!onDelete || deleting) return
    setDeleting(true)
    try {
      await onDelete(post.id)
    } finally {
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <GlassCard className="post-card">
      <header className="post-header">
        <Link to={`/u/${post.author.handle}`} className="post-avatar-link">
          {post.author.avatarUrl ? (
            <img className="post-avatar" src={post.author.avatarUrl} alt="" />
          ) : (
            <div className="post-avatar post-avatar-fallback" aria-hidden="true">
              {initials}
            </div>
          )}
        </Link>
        <div className="post-meta-main">
          <div className="post-author-line">
            <Link to={`/u/${post.author.handle}`} className="post-author-name">
              {post.author.displayName}
            </Link>
            <Link to={`/u/${post.author.handle}`} className="post-author-handle">
              @{post.author.handle}
            </Link>
            {post.visibility === 'friends' ? (
              <span className="post-visibility-badge" title="Visible to followers only">
                <i className="fa-solid fa-user-group" aria-hidden="true" /> followers
              </span>
            ) : null}
          </div>
          <time className="post-time" dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString()}>
            {timeAgo}
          </time>
        </div>

        {isAuthor && onDelete ? (
          <div className="post-author-actions">
            {confirmingDelete ? (
              <div className="post-delete-confirm">
                <span className="post-delete-warn">Delete?</span>
                <Button
                  variant="primary"
                  loading={deleting}
                  onClick={() => void handleDelete()}
                  className="btn-danger-sm"
                  title="Confirm delete"
                >
                  Yes
                </Button>
                <Button
                  variant="ghost"
                  disabled={deleting}
                  onClick={() => setConfirmingDelete(false)}
                  className="btn-cancel-sm"
                >
                  No
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="post-action-btn"
                title="Delete post"
                onClick={() => setConfirmingDelete(true)}
              >
                <i className="fa-solid fa-trash-can" aria-hidden="true" />
              </button>
            )}
          </div>
        ) : null}
      </header>

      <div className="post-body">
        <p>{post.body}</p>
      </div>

      <footer className="post-footer">
        <div className="post-reactions" role="group" aria-label="Reactions">
          {reactionTypes.map((type) => {
            const hasReacted = myReactions.includes(type.key)
            const count = post.reactionBreakdown?.[type.key] ?? 0
            const isPending = reactingType === type.key

            return (
              <button
                key={type.key}
                type="button"
                className={`reaction-pill ${hasReacted ? 'reaction-pill-active' : ''}`}
                onClick={() => void handleToggleReaction(type.key)}
                disabled={!currentUserId || isPending}
                aria-pressed={hasReacted}
                title={
                  currentUserId
                    ? `${hasReacted ? 'Remove' : 'React with'} ${type.label}`
                    : 'Sign in to react'
                }
              >
                <span className="reaction-glyph" aria-hidden="true">
                  {type.glyph}
                </span>
                {count > 0 ? <span className="reaction-count">{count}</span> : null}
              </button>
            )
          })}
        </div>
      </footer>
    </GlassCard>
  )
}

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString)
  const now = Date.now()
  const diffMs = now - date.getTime()
  if (Number.isNaN(diffMs)) return 'the mists'

  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 45) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}d ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}
