import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useSession } from '../../hooks/useSession'
import { backend, isBackendConfigured, isBackendError } from '../../services'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { Link, navigate } from '../../app/router'
import type { Profile } from '../../types/domain'

const MAX_DISPLAY_NAME = 50
const MAX_STATUS = 140
const MAX_BIO = 500

interface FormState {
  displayName: string
  customStatus: string
  bio: string
  avatarUrl: string
  bannerUrl: string
}

function toForm(profile: Profile): FormState {
  return {
    displayName: profile.displayName,
    customStatus: profile.customStatus ?? '',
    bio: profile.bio,
    avatarUrl: profile.avatarUrl ?? '',
    bannerUrl: profile.bannerUrl ?? '',
  }
}

export function SettingsPage() {
  const { session } = useSession()
  const showToast = useToast()
  const configured = isBackendConfigured()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(configured)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const [own, owner] = await Promise.all([
        backend.profiles.getOwn(),
        backend.roles.isOwner().catch(() => false),
      ])
      setProfile(own)
      setForm(own ? toForm(own) : null)
      setIsOwner(owner)
    } catch (err) {
      setError(isBackendError(err) ? err.message : 'Could not load your profile.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (configured) void load()
  }, [configured, load])

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    if (!form.displayName.trim()) {
      setError('Display name cannot be empty.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const updated = await backend.profiles.updateOwn({
        displayName: form.displayName.trim(),
        customStatus: form.customStatus.trim() || null,
        bio: form.bio.trim(),
        avatarUrl: form.avatarUrl.trim() || null,
        bannerUrl: form.bannerUrl.trim() || null,
      })
      setProfile(updated)
      setForm(toForm(updated))
      showToast('success', 'Profile saved.')
    } catch (err) {
      const message = isBackendError(err) ? err.message : 'Could not save your profile.'
      setError(message)
      showToast('error', message)
    } finally {
      setSaving(false)
    }
  }

  async function onSignOut() {
    await backend.auth.signOut()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <nav className="app-nav" aria-label="Primary">
        <Link className="app-brand" to="/feed">
          Hallowmarsh
        </Link>
        <div className="app-nav-actions">
          <Link className="btn btn-ghost" to="/feed">
            Back to feed
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => void onSignOut()}>
            <i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> Sign out
          </button>
        </div>
      </nav>
      <main className="app-main">
        <h1>Settings</h1>

        <Card className="settings-card">
          <h2>Account</h2>
          <p>
            Signed in as <strong>{session?.email ?? 'unknown'}</strong>
            {session?.emailVerified ? '' : ' (email not verified)'}
          </p>
        </Card>

        <Card className="settings-card">
          <h2>Profile</h2>
          {!configured ? (
            <p>The backend isn't connected. Add your Supabase keys to .env to edit your profile.</p>
          ) : loading ? (
            <p className="boot-screen" role="status" aria-live="polite">
              Loading profile…
            </p>
          ) : !form ? (
            <p>No profile found for this account.</p>
          ) : (
            <form className="settings-form" onSubmit={(e) => void onSave(e)} noValidate>
              {error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}

              <label className="field-label" htmlFor="display-name">
                Display name
              </label>
              <input
                id="display-name"
                className="text-input"
                type="text"
                maxLength={MAX_DISPLAY_NAME}
                value={form.displayName}
                onChange={(e) => update('displayName', e.target.value)}
              />

              <label className="field-label" htmlFor="handle-readonly">
                Handle
              </label>
              <input
                id="handle-readonly"
                className="text-input"
                type="text"
                value={profile?.handle ?? ''}
                readOnly
                disabled
              />
              <p className="field-hint">Handles are fixed once your account exists.</p>

              <label className="field-label" htmlFor="custom-status">
                Status
              </label>
              <input
                id="custom-status"
                className="text-input"
                type="text"
                maxLength={MAX_STATUS}
                placeholder="What are you up to?"
                value={form.customStatus}
                onChange={(e) => update('customStatus', e.target.value)}
              />

              <label className="field-label" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                className="field-textarea"
                maxLength={MAX_BIO}
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
              />

              <label className="field-label" htmlFor="avatar-url">
                Avatar URL
              </label>
              <input
                id="avatar-url"
                className="text-input"
                type="url"
                placeholder="https://…"
                value={form.avatarUrl}
                onChange={(e) => update('avatarUrl', e.target.value)}
              />

              <label className="field-label" htmlFor="banner-url">
                Banner URL
              </label>
              <input
                id="banner-url"
                className="text-input"
                type="url"
                placeholder="https://…"
                value={form.bannerUrl}
                onChange={(e) => update('bannerUrl', e.target.value)}
              />

              <div className="settings-actions">
                <Button type="submit" loading={saving}>
                  Save profile
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={saving}
                  onClick={() => {
                    if (profile) setForm(toForm(profile))
                    setError(null)
                  }}
                >
                  Reset
                </Button>
                {profile ? (
                  <Link className="text-link" to={`/u/${profile.handle}`}>
                    View profile
                  </Link>
                ) : null}
              </div>
            </form>
          )}
        </Card>

        {isOwner ? (
          <Card className="settings-card">
            <h2>Admin</h2>
            <p>Manage the projects shown on the public landing page.</p>
            <div className="settings-actions">
              <Link className="btn btn-ghost" to="/admin">
                Manage projects
              </Link>
            </div>
          </Card>
        ) : null}
      </main>
    </div>
  )
}
