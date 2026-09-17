import { Link } from '../../app/router'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'

/**
 * Blog index. Nothing is published yet, so the page says so instead of
 * showing placeholder articles.
 */
export function BlogPage() {
  return (
    <div className="site-page">
      <header className="site-header">
        <Link to="/" className="app-brand">
          hallowmarshmallow
        </Link>
        <Link to="/login" className="text-link">
          Sign in
        </Link>
      </header>

      <main className="site-main">
        <Card>
          <section aria-labelledby="blog-heading">
            <h1 id="blog-heading" className="intro-title">
              Blog
            </h1>
            <EmptyState
              icon={<i className="fa-solid fa-pen" aria-hidden="true" />}
              title="Nothing published yet."
              hint="Writing here is planned. There are no posts to read at the moment."
            />
          </section>
        </Card>
      </main>

      <footer className="site-footer">
        <Link to="/">Back home</Link>
      </footer>
    </div>
  )
}
