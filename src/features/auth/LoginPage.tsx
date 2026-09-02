import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { useToast } from '../../components/ui/Toast'
import { backend, BackendError, isBackendConfigured, UNCONFIGURED_MESSAGE } from '../../services'
import type { AuthProvider } from '../../types/domain'

const OAUTH_BUTTONS: Array<{ provider: Exclude<AuthProvider, 'email'>; label: string }> = [
  { provider: 'google', label: 'Continue with Google' },
  { provider: 'discord', label: 'Continue with Discord' },
  { provider: 'github', label: 'Continue with GitHub' },
]

export function LoginPage({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const showToast = useToast()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<BackendError | null>(null)

  const configured = isBackendConfigured()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!configured) {
      setFormError(new BackendError('provider_error', UNCONFIGURED_MESSAGE))
      return
    }
    setBusy(true)
    setFormError(null)
    try {
      if (mode === 'signup') {
        await backend.auth.signUp({ email, password, handle: email.split('@')[0] })
        showToast('success', 'Account created. Check your inbox to verify your email.')
      } else {
        await backend.auth.signIn({ email, password })
        onAuthSuccess()
      }
    } catch (err) {
      setFormError(err instanceof BackendError ? err : new BackendError('server_error', 'Something went wrong. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  async function onOAuth(provider: Exclude<AuthProvider, 'email'>) {
    try {
      await backend.auth.signInWithOAuth(provider)
      // OAuth redirects away from the page; nothing further to do here.
    } catch (err) {
      showToast('error', err instanceof BackendError ? err.message : 'Could not start sign-in.')
    }
  }

  return (
    <main className="auth-page">
      <GlassCard className="auth-card">
        <h1 className="auth-title">Enter the marsh</h1>
        {!configured ? (
          <div className="auth-unconfigured" role="note">
            <p>The backend isn&rsquo;t connected yet — accounts can&rsquo;t work without one. The fix is two values:</p>
            <ol>
              <li>
                Create a free project at{' '}
                <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
                  supabase.com
                </a>
              </li>
              <li>
                Put its URL + anon key into <code>.env</code> (copy from <code>.env.example</code>) and restart the dev
                server
              </li>
            </ol>
            <p className="auth-unconfigured-note">This page works the moment those exist.</p>
          </div>
        ) : (
          <>
            <div className="oauth-stack">
              {OAUTH_BUTTONS.map(({ provider, label }) => (
                <Button key={provider} variant="ghost" onClick={() => void onOAuth(provider)}>
                  {label}
                </Button>
              ))}
            </div>
            <div className="auth-divider" role="separator">
              or
            </div>
            <form onSubmit={onSubmit} noValidate>
              {formError ? (
                <p className="form-error" role="alert">
                  {formError.message}
                </p>
              ) : null}
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-input"
              />
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-input"
                aria-describedby="password-req"
              />
              <p id="password-req" className="field-hint">
                8+ characters.
              </p>
              <Button type="submit" loading={busy} className="auth-submit">
                {mode === 'signup' ? 'Create account' : 'Sign in'}
              </Button>
            </form>
            <button
              type="button"
              className="linklike"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setFormError(null)
              }}
            >
              {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
            </button>
          </>
        )}
      </GlassCard>
    </main>
  )
}
