import { useEffect, useState } from "react";
import { Link } from "../../app/router";
import { Card } from "../../components/ui/Card";
import { backend } from "../../services";
import { StarButton } from "./StarButton";
import type { ProjectEntry } from "../../types/domain";

/**
 * Public landing page: a short introduction, the projects, contact details,
 * and a link to the blog.
 */

const GITHUB_USER = "hallowmarshmallow";
const GITHUB_URL = `https://github.com/${GITHUB_USER}`;

/** Shown under Contact. A Discord username is not a URL, so it renders as text. */
const DISCORD_HANDLE = "hallowmarshmallow";

/**
 * Used until the projects table answers, so the page still works on a fresh
 * clone with no backend configured. The owner edits the real list at /admin.
 */
const FALLBACK_PROJECTS: ProjectEntry[] = [
  {
    id: "fallback-hallowmarsh",
    title: "Hallowmarsh",
    description: "This site: a small invite-only community and portfolio.",
    repo: `${GITHUB_USER}/marshy.cc.cd`,
    imageUrl: null,
    sort: 1,
    published: true,
  },
  {
    id: "fallback-marshapi",
    title: "MarshAPI",
    description: "A fork of the ClassicUs API, kept updated for 2026.8.9.",
    repo: `${GITHUB_USER}/ClassicUs.MarshAPI`,
    imageUrl: null,
    sort: 2,
    published: true,
  },
  {
    id: "fallback-reactor",
    title: "ClassicUs.Reactor",
    description: "A modded handshake for the game Classicus.",
    repo: `${GITHUB_USER}/ClassicUs.Reactor`,
    imageUrl: null,
    sort: 3,
    published: true,
  },
  {
    id: "fallback-decompiled",
    title: "Classicus decompiled",
    description: "A decompiled dump of Classic Us plus Il2Cpp decompiler tooling.",
    repo: `${GITHUB_USER}/classicus-decompiled`,
    imageUrl: null,
    sort: 4,
    published: true,
  },
  {
    id: "fallback-townofroles",
    title: "townofroles",
    description: "A small project. Description to come.",
    repo: `${GITHUB_USER}/townofroles`,
    imageUrl: null,
    sort: 5,
    published: true,
  },
];

export function PortfolioPage() {
  const [projects, setProjects] = useState<ProjectEntry[]>(FALLBACK_PROJECTS);

  useEffect(() => {
    let active = true;
    backend.projects
      .listPublished()
      .then((list) => {
        if (active) setProjects(list);
      })
      .catch(() => {
        // No backend yet, or the projects table has not been applied: keep the
        // built-in list rather than showing an empty section.
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="site-page">
      <header className="site-header">
        <Link to="/" className="app-brand">
          {GITHUB_USER}
        </Link>
        <Link to="/login" className="text-link">
          Sign in
        </Link>
      </header>

      <main className="site-main">
        <Card>
          <section aria-labelledby="intro-heading">
            <h1 id="intro-heading" className="intro-title">
              Hi, I'm {GITHUB_USER}.
            </h1>
            <p className="intro-text">
              I make small things, mostly for old games, and I rarely finish
              them. None of it is impressive. This page is just where I keep
              track of what I've been poking at.
            </p>
            <div className="intro-actions">
              <Link to="/blog" className="btn btn-ghost">
                Blog posts
              </Link>
            </div>
          </section>
        </Card>

        <Card>
          <section aria-labelledby="projects-heading">
            <h2 id="projects-heading" className="site-section-title">
              Projects
            </h2>
            {projects.length === 0 ? (
              <p className="repo-desc">Nothing published right now.</p>
            ) : (
              <ul className="repo-list">
                {projects.map((project) => (
                  <li className="repo-item" key={project.id}>
                    <div className="repo-thumb">
                      {project.imageUrl ? (
                        <img src={project.imageUrl} alt="" loading="lazy" />
                      ) : (
                        <i
                          className="fa-regular fa-image repo-thumb-empty"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="repo-info">
                      {project.repo ? (
                        <a
                          className="repo-name"
                          href={`https://github.com/${project.repo}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {project.title}
                          <i
                            className="fa-solid fa-arrow-up-right-from-square"
                            aria-hidden="true"
                          />
                        </a>
                      ) : (
                        <span className="repo-name">{project.title}</span>
                      )}
                      {project.description ? (
                        <p className="repo-desc">{project.description}</p>
                      ) : null}
                    </div>
                    {project.repo ? (
                      <div className="repo-actions">
                        <StarButton repo={project.repo} />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Card>

        <Card>
          <section aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="site-section-title">
              Contact
            </h2>
            <ul className="contact-list">
              <li>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </li>
              <li>
                Discord <span className="contact-value">{DISCORD_HANDLE}</span>
              </li>
            </ul>
          </section>
        </Card>
      </main>

      <footer className="site-footer">© 2026 {GITHUB_USER}</footer>
    </div>
  );
}
