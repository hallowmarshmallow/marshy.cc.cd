import { GlassCard } from '../../components/ui/GlassCard'
import { Link } from '../../app/router'

const LINKS: Array<{ label: string; url: string }> = [
  { label: 'GitHub', url: 'https://github.com/hallowmarshmallow' },
]

export function PortfolioPage() {
  return (
    <main className="portfolio">
      <section className="hero" aria-labelledby="hero-heading">
        <p className="hero-eyebrow">marshy.cc.cd</p>
        <h1 id="hero-heading">A small, quiet place on the internet.</h1>
        <p className="hero-sub">
          Home of Hallowmarsh — a tiny community for friends, devs, and artists. The public porch of the marsh.
        </p>
        <div className="hero-actions">
          <Link to="/login" className="btn btn-primary">
            Join the marsh
          </Link>
          <a className="btn btn-ghost" href="https://github.com/hallowmarshmallow" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </section>

      <section className="portfolio-section" aria-labelledby="about-heading">
        <h2>About</h2>
        <GlassCard className="about-card">
          <p>
            Hallowmarsh is a personal ecosystem: a portfolio out here, a cozy community in there. Built small on
            purpose, and honest about what exists and what's planned.
          </p>
        </GlassCard>
      </section>

      <section className="portfolio-section" aria-labelledby="projects-heading">
        <h2>Projects</h2>
        <div className="project-grid">
          <GlassCard className="project-card">
            <h3>ClassicUs.MarshAPI</h3>
            <p>A fork of ClassicUs.ManuAPI updated for 2026.8.9 (no gamelibs).</p>
            <p className="project-tech">C# · GitHub</p>
            <a href="https://github.com/hallowmarshmallow/ClassicUs.MarshAPI" target="_blank" rel="noopener noreferrer">
              View on GitHub →
            </a>
          </GlassCard>
          <GlassCard className="project-card project-card-planned">
            <h3>Hallowmarsh itself</h3>
            <p>The community platform you're looking at. Feed, profiles, themes — being built in the open.</p>
            <p className="project-tech">TypeScript · React · Supabase</p>
          </GlassCard>
        </div>
      </section>

      <section className="portfolio-section" aria-labelledby="links-heading">
        <h2>Elsewhere</h2>
        <GlassCard>
          <ul className="link-list">
            {LINKS.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">
                  {l.label} →
                </a>
              </li>
            ))}
          </ul>
        </GlassCard>
      </section>

      <footer className="portfolio-footer">
        <p>© 2026 hallowmarshmallow · marshy.cc.cd</p>
      </footer>
    </main>
  )
}
