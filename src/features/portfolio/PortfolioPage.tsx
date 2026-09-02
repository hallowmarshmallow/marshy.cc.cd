import { GlassCard } from '../../components/ui/GlassCard'
import { Atmosphere } from '../../components/atmosphere/Atmosphere'
import { Link } from '../../app/router'

const LINKS: Array<{ icon: string; label: string; url: string }> = [
  { icon: 'fa-brands fa-github', label: 'GitHub', url: 'https://github.com/hallowmarshmallow' },
]

const SKILLS: Array<{ icon: string; name: string; note: string }> = [
  { icon: 'fa-solid fa-code', name: 'TypeScript', note: 'This very site' },
  { icon: 'fa-solid fa-cubes', name: 'C# / .NET', note: 'ClassicUs tooling' },
  { icon: 'fa-solid fa-terminal', name: 'Tooling & bots', note: 'Modded clients, scripts' },
  { icon: 'fa-solid fa-wand-magic-sparkles', name: 'Community design', note: 'Hallowmarsh itself' },
]

const GALLERY: Array<{ glyph: string; label: string; planned: boolean }> = [
  { glyph: 'fa-solid fa-moon', label: 'Moonrise over the marsh', planned: false },
  { glyph: 'fa-solid fa-leaf', label: 'Fog study I', planned: false },
  { glyph: 'fa-solid fa-fire-flame-curved', label: 'Ember pond', planned: false },
  { glyph: 'fa-solid fa-tower-observation', label: 'The watchtower', planned: false },
  { glyph: 'fa-solid fa-water', label: 'Still water', planned: false },
  { glyph: 'fa-solid fa-ghost', label: 'Hallowmarsh, at dusk', planned: false },
]

export function PortfolioPage() {
  return (
    <div className="portfolio-wrap">
      <Atmosphere />
      <main className="portfolio">
        {/* HERO */}
        <section className="hero" aria-labelledby="hero-heading">
          <p className="hero-eyebrow">
            <i className="fa-solid fa-leaf" aria-hidden="true" /> marshy.cc.cd
          </p>
          <h1 id="hero-heading">
            A small, quiet place
            <br />
            <em className="hero-serif">on the internet.</em>
          </h1>
          <p className="hero-sub">
            Home of Hallowmarsh — a tiny community for friends, developers, and artists. Built small on
            purpose, honest about what exists, and growing like a garden.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary btn-lg">
              <i className="fa-solid fa-door-open" aria-hidden="true" /> Join the marsh
            </Link>
            <a className="btn btn-ghost btn-lg" href="https://github.com/hallowmarshmallow" target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-github" aria-hidden="true" /> GitHub
            </a>
          </div>
          <p className="hero-stats">
            <span>
              <i className="fa-solid fa-seedling" aria-hidden="true" /> Founded 2026
            </span>
            <span>
              <i className="fa-solid fa-users" aria-hidden="true" /> Phase 1 · early growth
            </span>
            <span>
              <i className="fa-solid fa-code-branch" aria-hidden="true" /> Built in the open
            </span>
          </p>
        </section>

        {/* ABOUT */}
        <section className="portfolio-section" aria-labelledby="about-heading">
          <h2 className="section-title">
            <i className="fa-solid fa-fire-flame-curved" aria-hidden="true" /> About
          </h2>
          <GlassCard className="about-card">
            <p>
              Hallowmarsh is a personal ecosystem: a quiet portfolio out here, a cozy community in there.
              No algorithm, no noise — just a place for friends to build, share, and linger.
            </p>
          </GlassCard>
        </section>

        {/* PROJECTS */}
        <section className="portfolio-section" aria-labelledby="projects-heading">
          <h2 className="section-title">
            <i className="fa-solid fa-diagram-project" aria-hidden="true" /> Projects
          </h2>
          <div className="project-grid">
            <GlassCard className="project-card">
              <div className="project-icon">
                <i className="fa-brands fa-git-alt" aria-hidden="true" />
              </div>
              <h3>ClassicUs.MarshAPI</h3>
              <p>A fork of ClassicUs.ManuAPI updated for 2026.8.9 (no gamelibs).</p>
              <p className="project-tech">C# · GitHub</p>
              <a href="https://github.com/hallowmarshmallow/ClassicUs.MarshAPI" target="_blank" rel="noopener noreferrer">
                View on GitHub <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
              </a>
            </GlassCard>
            <GlassCard className="project-card project-card-planned">
              <div className="project-icon">
                <i className="fa-solid fa-ghost" aria-hidden="true" />
              </div>
              <h3>Hallowmarsh itself</h3>
              <p>The community platform you're looking at. Feed, profiles, themes — built in the open.</p>
              <p className="project-tech">TypeScript · React · Supabase</p>
              <span className="planned-tag">
                <i className="fa-solid fa-seedling" aria-hidden="true" /> Growing now
              </span>
            </GlassCard>
          </div>
        </section>

        {/* SKILLS */}
        <section className="portfolio-section" aria-labelledby="skills-heading">
          <h2 className="section-title">
            <i className="fa-solid fa-screwdriver-wrench" aria-hidden="true" /> Skills
          </h2>
          <div className="skill-grid">
            {SKILLS.map((s) => (
              <div className="skill-tile" key={s.name}>
                <i className={s.icon} aria-hidden="true" />
                <div>
                  <p className="skill-name">{s.name}</p>
                  <p className="skill-note">{s.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* GALLERY */}
        <section className="portfolio-section" aria-labelledby="gallery-heading">
          <h2 className="section-title">
            <i className="fa-solid fa-images" aria-hidden="true" /> Gallery
          </h2>
          <p className="section-note">Illustrative placeholders — real art gets uploaded via the app (Phase 4).</p>
          <div className="gallery-grid">
            {GALLERY.map((g) => (
              <figure className="gallery-item" key={g.label}>
                <div className="gallery-art">
                  <i className={g.glyph} aria-hidden="true" />
                </div>
                <figcaption>{g.label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* COMMUNITY CTA */}
        <section className="portfolio-section" aria-labelledby="community-heading">
          <h2 className="section-title">
            <i className="fa-solid fa-comments" aria-hidden="true" /> The community
          </h2>
          <GlassCard className="community-card">
            <p className="community-line">“This is our place on the internet.”</p>
            <p className="community-sub">
              Feed, profiles, custom themes, badges — a small pond with room to grow. Accounts are open.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary btn-lg">
                <i className="fa-solid fa-door-open" aria-hidden="true" /> Step inside
              </Link>
            </div>
          </GlassCard>
        </section>

        {/* ELSEWHERE */}
        <section className="portfolio-section" aria-labelledby="links-heading">
          <h2 className="section-title">
            <i className="fa-solid fa-link" aria-hidden="true" /> Elsewhere
          </h2>
          <GlassCard>
            <ul className="link-list">
              {LINKS.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer">
                    <i className={l.icon} aria-hidden="true" /> {l.label}{' '}
                    <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </GlassCard>
        </section>

        <footer className="portfolio-footer">
          <p>
            © 2026 hallowmarshmallow · marshy.cc.cd · <i className="fa-solid fa-fan" aria-hidden="true" /> built
            with quiet obsession
          </p>
        </footer>
      </main>
    </div>
  )
}
