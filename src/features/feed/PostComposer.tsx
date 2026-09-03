import { useState, type FormEvent } from 'react'
import { backend, isBackendError } from '../../services'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import type { Post, Profile, Visibility } from '../../types/domain'

interface PostComposerProps {
  onPostCreated: (post: Post) => void
  userProfile?: Profile | null
}

const MAX_POST_LENGTH = 2000

export function PostComposer({ onPostCreated, userProfile }: PostComposerProps) {
  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('public')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const showToast = useToast()

  const trimmed = body.trim()
  const charCount = body.length
  const isOverLimit = charCount > MAX_POST_LENGTH
  const isNearLimit = charCount >= 1800
  const canSubmit = trimmed.length > 0 && !isOverLimit && !submitting

  const initials = userProfile?.handle ? userProfile.handle.slice(0, 2).toUpperCase() : 'ME'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)
    setSubmitting(true)

    try {
      const newPost = await backend.posts.create({
        body: trimmed,
        visibility,
      })

      // If userProfile is known, enrich post author info
      if (userProfile) {
        newPost.author = {
          handle: userProfile.handle,
          displayName: userProfile.displayName,
          avatarUrl: userProfile.avatarUrl,
        }
      }

      setBody('')
      showToast('success', 'Your ripple has stirred the marsh.')
      onPostCreated(newPost)
    } catch (err) {
      const msg = isBackendError(err) ? err.message : 'Could not share post right now. Please retry.'
      setError(msg)
      showToast('error', msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GlassCard className="composer-card">
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="composer-top">
          <div className="composer-avatar-wrap">
            {userProfile?.avatarUrl ? (
              <img className="composer-avatar" src={userProfile.avatarUrl} alt="" />
            ) : (
              <div className="composer-avatar composer-avatar-fallback" aria-hidden="true">
                {initials}
              </div>
            )}
          </div>
          <div className="composer-input-area">
            <textarea
              className="composer-textarea"
              placeholder="What ripples through the marsh? Speak into the reeds…"
              value={body}
              onChange={(e) => {
                setBody(e.target.value)
                if (error) setError(null)
              }}
              rows={3}
              maxLength={MAX_POST_LENGTH + 100}
              aria-label="Write a post"
            />
          </div>
        </div>

        {error ? (
          <p className="form-error composer-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="composer-footer">
          <div className="composer-meta">
            <label className="composer-visibility-label" htmlFor="composer-visibility">
              <i
                className={`fa-solid ${visibility === 'public' ? 'fa-earth-americas' : 'fa-user-group'}`}
                aria-hidden="true"
              />
              <select
                id="composer-visibility"
                className="composer-visibility-select"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as Visibility)}
                disabled={submitting}
              >
                <option value="public">Public</option>
                <option value="friends">Followers only</option>
              </select>
            </label>

            <span
              className={`composer-char-count ${
                isOverLimit ? 'composer-char-over' : isNearLimit ? 'composer-char-warn' : ''
              }`}
            >
              {charCount}/{MAX_POST_LENGTH}
            </span>
          </div>

          <Button
            variant="primary"
            loading={submitting}
            disabled={!canSubmit}
            type="submit"
            className="composer-submit-btn"
          >
            <i className="fa-solid fa-feather-pointed" aria-hidden="true" /> Post
          </Button>
        </div>
      </form>
    </GlassCard>
  )
}
