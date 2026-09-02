import { useSession } from '../../hooks/useSession'
import { backend, isBackendConfigured } from '../../services'
import { GlassCard } from '../../components/ui/GlassCard'
import { navigate } from '../../app/router'

export function SettingsPage() {
  const { session } = useSession()
  const configured = isBackendConfigured()

  async function onSignOut() {
    await backend.auth.signOut()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <nav className="app-nav glass" aria-label="Primary">
        <span className="app-brand">Hallowmarsh</span>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/feed')}>
          Back
        </button>
      </nav>
      <main className="app-main">
        <h1>Settings</h1>
        <GlassCard className="settings-card">
          <h2>Account</h2>
          <p>
            Signed in as <strong>{session?.email ?? 'unknown'}</strong>
            {session?.emailVerified ? '' : ' (email not yet verified)'}
          </p>
          <button type="button" className="btn btn-ghost" onClick={() => void onSignOut()}>
            Sign out
          </button>
        </GlassCard>
        <GlassCard className="settings-card">
          <h2>Profile editing</h2>
          {configured ? (
            <p>Profile editing connects to the database once the Phase-1 schema migration is applied.</p>
          ) : (
            <p>The backend isn't connected yet — add your Supabase keys to .env to enable it.</p>
          )}
        </GlassCard>
      </main>
    </div>
  )
}
