import { Link } from "../../app/router";
import { Atmosphere } from "../../components/atmosphere/Atmosphere";
import { GlassCard } from "../../components/ui/GlassCard";

const PRINCIPLES = [
  {
    icon: "fa-solid fa-volume-xmark",
    title: "No performance",
    body: "Share the rough draft, the half-formed idea, or nothing at all.",
  },
  {
    icon: "fa-solid fa-people-roof",
    title: "Small by design",
    body: "A room for familiar names and new friends—not an audience.",
  },
  {
    icon: "fa-solid fa-lock",
    title: "Private by default",
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
          <span className="nav-status">
            <span className="live-mark" aria-hidden="true" /> doors are quiet
          </span>
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
              <i className="fa-solid fa-sparkles" aria-hidden="true" />{" "}
              marshy.cc.cd · private beta
            </p>
            <h1 id="hero-heading">
              A small room for
              <br />
              <em className="hero-serif">big little things.</em>
            </h1>
            <p className="hero-sub">
              Hallowmarsh is a private corner of the internet for friends,
              developers, and artists who would rather make something real than
              feed the scroll.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary btn-lg">
                <i className="fa-solid fa-key" aria-hidden="true" /> Enter with
                an invite
              </Link>
              <a className="text-link" href="#inside">
                See what’s inside{" "}
                <i className="fa-solid fa-arrow-down" aria-hidden="true" />
              </a>
            </div>
          </div>
          <GlassCard className="hero-console">
            <div className="console-topline">
              <span className="console-pulse">
                <span className="live-mark" aria-hidden="true" /> LIVE ROOM
              </span>
              <span>01 / 03</span>
            </div>
            <div className="console-orbit" aria-hidden="true">
              <span className="orbit-ring orbit-ring-one" />
              <span className="orbit-ring orbit-ring-two" />
              <span className="orbit-core">
                <i className="fa-solid fa-ghost" />
              </span>
              <span className="orbit-spark spark-one" />
              <span className="orbit-spark spark-two" />
            </div>
            <p className="console-title">The lights are on.</p>
            <p className="console-copy">
              A few good people are already making ripples. Public doors come
              later.
            </p>
            <div className="console-footer">
              <span>
                <i className="fa-solid fa-shield-halved" aria-hidden="true" />{" "}
                invite-only
              </span>
              <span>
                <i className="fa-solid fa-moon" aria-hidden="true" /> low noise
              </span>
            </div>
          </GlassCard>
        </section>

        <div className="hero-stats" aria-label="Hallowmarsh status">
          <span>
            <i className="fa-solid fa-circle-check" aria-hidden="true" />{" "}
            private beta
          </span>
          <span>
            <i className="fa-solid fa-user-group" aria-hidden="true" /> small on
            purpose
          </span>
          <span>
            <i className="fa-solid fa-code" aria-hidden="true" /> growing in
            public, living in private
          </span>
        </div>

        <section
          id="inside"
          className="portfolio-section intro-section"
          aria-labelledby="inside-heading"
        >
          <div className="section-heading-row">
            <p className="section-index">01 / the feeling</p>
            <h2 id="inside-heading">
              A place with a pulse,
              <br />
              <em>without the pressure.</em>
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
            <p className="section-index">02 / things in motion</p>
            <h2 id="projects-heading">
              Built in the open.
              <br />
              <em>Shared with care.</em>
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
