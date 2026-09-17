import { Link } from "../../app/router";
import { Atmosphere } from "../../components/atmosphere/Atmosphere";
import { GlassCard } from "../../components/ui/GlassCard";

const PRINCIPLES = [
  {
    icon: "fa-solid fa-volume-xmark",
    title: "Bring the rough draft",
    body: "Share the rough draft, the half-formed idea, or nothing at all.",
  },
  {
    icon: "fa-solid fa-people-roof",
    title: "Keep it small",
    body: "A room for familiar names and new friends—not an audience.",
  },
  {
    icon: "fa-solid fa-lock",
    title: "Private for now",
    body: "Profiles and ripples stay inside the marsh while the doors are invite-only.",
  },
];

const PROJECTS = [
  {
    label: "In progress",
    title: "Hallowmarsh",
    body: "A living room for notes, experiments, and the people making them.",
    icon: "fa-solid fa-water",
  },
  {
    label: "Built with care",
    title: "MarshAPI",
    body: "Small tools for classic game worlds, kept useful and pleasantly unglamorous.",
    icon: "fa-solid fa-cubes",
  },
];

export function PortfolioPage() {
  return (
    <div className="portfolio-wrap">
      <Atmosphere />
      <nav className="portfolio-nav" aria-label="Site">
        <span className="app-brand">
          <i className="fa-solid fa-ghost app-brand-icon" aria-hidden="true" />{" "}
          Hallowmarsh
        </span>
        <div className="portfolio-nav-right">
          <Link to="/login" className="nav-login">
            Member sign in{" "}
            <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </nav>

      <main className="portfolio">
        <section className="hero hero-grid" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <p className="hero-eyebrow">
              <i className="fa-solid fa-leaf" aria-hidden="true" /> marshy.cc.cd
              · private beta
            </p>
            <h1 id="hero-heading">
              A small room for
              <br />
              <em className="hero-serif">little things.</em>
            </h1>
            <p className="hero-sub">
              Hallowmarsh is a private corner of the internet for friends,
              developers, and artists. Bring a half-finished idea, a picture, or
              a quiet hello.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary btn-lg">
                <i className="fa-solid fa-key" aria-hidden="true" /> Come in
                with an invite
              </Link>
              <a className="text-link" href="#inside">
                See what’s inside{" "}
                <i className="fa-solid fa-arrow-down" aria-hidden="true" />
              </a>
            </div>
          </div>
          <GlassCard className="hero-note">
            <p className="hero-note-label">A note from the marsh</p>
            <p className="hero-note-copy">
              “Keep the circle small. Let the good stuff take its time.”
            </p>
            <p className="hero-note-signoff">— hallowmarshmallow</p>
          </GlassCard>
        </section>

        <div className="hero-stats" aria-label="Hallowmarsh status">
          <span>private beta</span>
          <span>member-only</span>
          <span>made slowly</span>
        </div>

        <section
          id="inside"
          className="portfolio-section intro-section"
          aria-labelledby="inside-heading"
        >
          <div className="section-heading-row">
            <p className="section-index">01 / the feeling</p>
            <h2 id="inside-heading">
              A place to make things,
              <br />
              <em>without the audience.</em>
            </h2>
          </div>
          <div className="principles-grid">
            {PRINCIPLES.map((principle) => (
              <GlassCard className="principle-card" key={principle.title}>
                <i className={principle.icon} aria-hidden="true" />
                <h3>{principle.title}</h3>
                <p>{principle.body}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <section
          className="portfolio-section"
          aria-labelledby="projects-heading"
        >
          <div className="section-heading-row section-heading-compact">
            <p className="section-index">02 / things being made</p>
            <h2 id="projects-heading">
              A few things I’m building.
              <br />
              <em>Nothing too precious.</em>
            </h2>
          </div>
          <div className="project-grid">
            {PROJECTS.map((project) => (
              <GlassCard className="project-card" key={project.title}>
                <div className="project-card-top">
                  <div className="project-icon">
                    <i className={project.icon} aria-hidden="true" />
                  </div>
                  <span className="project-label">{project.label}</span>
                </div>
                <h3>{project.title}</h3>
                <p>{project.body}</p>
                <span className="project-arrow" aria-hidden="true">
                  <i className="fa-solid fa-arrow-up-right" />
                </span>
              </GlassCard>
            ))}
          </div>
        </section>

        <section
          className="portfolio-section invite-section"
          aria-labelledby="invite-heading"
        >
          <GlassCard className="community-card">
            <p className="section-index">03 / the door</p>
            <h2 id="invite-heading">
              Keep the circle
              <br />
              <em>intentional.</em>
            </h2>
            <p className="community-sub">
              Hallowmarsh is invite-only while it finds its shape. If someone
              inside sent you a code, you’re welcome in. Public launch can wait.
            </p>
            <Link to="/login" className="btn btn-primary btn-lg">
              <i className="fa-solid fa-key" aria-hidden="true" /> I have an
              invite
            </Link>
          </GlassCard>
        </section>

        <footer className="portfolio-footer">
          <span>© 2026 hallowmarshmallow</span>
          <span>
            made slowly <i className="fa-solid fa-bolt" aria-hidden="true" />
          </span>
        </footer>
      </main>
    </div>
  );
}
