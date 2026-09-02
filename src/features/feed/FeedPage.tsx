import { useSession } from '../../hooks/useSession'
import { backend } from '../../services'
import { EmptyState } from '../../components/ui/EmptyState'
import { navigate } from '../../app/router'

/**
 * Phase-1 feed shell. The feed itself sprouts in Phase 2 (§17);
 * the shell, session, and sign-out are real and working now.
 */
export function FeedPage() {
  const { session } = useSession()

  async function onSignOut() {
    try {
      await backend.auth.signOut()
      navigate('/')
    } catch {
      // BackendError already surfaces via toast upstream; here navigation is the recovery.
      navigate('/')
    }
  }

  return (
    <div className="app-shell">
      <nav className="app-nav glass" aria-label="Primary">
        <span className="app-brand">
          <i className="fa-solid fa-ghost app-brand-icon" aria-hidden="true" /> Hallowmarsh
        </span>
        <div className="app-nav-actions">
          {session?.email ? <span className="app-nav-email">{session.email}</span> : null}
          <button type="button" className="btn btn-ghost" onClick={() => void onSignOut()}>
            <i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> Sign out
          </button>
        </div>
      </nav>
      <main className="app-main">
        <EmptyState
          icon={<i className="fa-solid fa-leaf" aria-hidden="true" />}
          title="Your marsh is quiet."
          hint="The feed sprouts in Phase 2."
        />
      </main>
    </div>
  )
}
