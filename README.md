# Hallowmarsh (`marshy.cc.cd`)

A small, invite-only community and portfolio. Dark and minimal: _our place on the internet._

**Status:** Private beta. Member feed, invite-gated onboarding, member profiles with
profile editing, password reset, OAuth sign-in, registry-driven reactions, and a
public portfolio with an owner-only project dashboard are live.

## Stack

| Layer    | Choice                                                    | Notes                        |
| -------- | --------------------------------------------------------- | ---------------------------- |
| Frontend | Vite + React 18 + TypeScript (strict)                     | Hash routing (Pages-safe)    |
| Backend  | Supabase (free tier) behind `src/services/BackendAdapter` | Provider-swappable by design |
| Hosting  | GitHub Pages (this repo)                                  | `404.html` SPA fallback      |
| Domain   | `marshy.cc.cd`, a DNSHE free subdomain                    | See `docs/INFRASTRUCTURE.md` |
| CI       | GitHub Actions                                            | lint → typecheck → test → build → secret scan |

## Quickstart (local / Codespace)

```bash
npm install
cp .env.example .env   # then paste your Supabase URL + anon key
npm run dev            # http://localhost:3000
```

Without a Supabase project the app **runs and is honest about it**: the login page
shows setup instructions instead of faking accounts. New accounts also require an
invite code.

### Scripts

| Script              | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Vite dev server on port 3000                       |
| `npm run build`     | Typecheck + production build to `dist/`            |
| `npm test`          | Unit tests (Vitest)                                |
| `npm run lint`      | ESLint (includes the services-layer boundary rule) |
| `npm run typecheck` | `tsc --noEmit`                                     |
| `npm run format`    | Prettier                                           |

## Connecting the backend (one-time)

1. Create a free project at [supabase.com](https://supabase.com).
2. **Settings → API**: copy the Project URL and anon key into `.env`.
3. Apply `supabase/migrations/0001_phase1.sql`, `0002_invite_only.sql`, `0003_projects.sql`, and `0004_media_uploads.sql`.
4. Insert invite codes as the owner in the Supabase SQL Editor, then restart `npm run dev`.
5. Sign-up/sign-in now work against your project; anonymous profile and post reads remain closed.

Email/password sign-in keeps invite codes inside one controlled onboarding flow.
The sign-in page also offers Google, Discord, and GitHub. Each provider only works
after it is enabled under **Authentication → Providers** in Supabase; until then
those buttons will surface the provider's error rather than pretending to sign you in.

## Deployment

`main` pushes deploy via GitHub Actions to GitHub Pages. Enable Pages once:
**Settings → Pages → Source: GitHub Actions**. The `deploy.yml` workflow builds,
deploys, and smoke-tests the live URL.

## Repository layout

```
src/
├── app/          # routing, shells, guards
├── components/   # reusable UI (Button, Card, Toast, EmptyState)
├── features/     # auth/ feed/ profiles/ settings/ portfolio/ (domain logic lives here)
├── services/     # ALL provider calls, behind the BackendAdapter seam
├── hooks/        # data hooks wrapping services
├── styles/       # tokens.ts (single source) + base.css + components.css
└── types/        # shared domain types
```

## Conventions

- **No fake functionality.** Deferred features are labeled _Planned_, never simulated.
- **All provider access goes through `src/services/`**, enforced by an ESLint rule.
- **Design tokens only.** Components consume CSS custom properties; no hardcoded values.
- **Server-side authorization is authoritative.** UI hiding is cosmetic.
- **Never commit secrets.** `.env` is gitignored; `.env.example` carries placeholders only.

## Owner dashboard

The landing page reads its project list from the `projects` table. The owner edits it
at `/admin` (also reachable from Settings): title, description, GitHub repo, image,
sort order, and a published toggle. Images can be uploaded directly (stored in the
public `media` bucket, 5 MB limit, owner-only writes) or set by URL. Everything is
enforced by RLS, so a non-owner sees a "not available" page even if they reach the route.

With no backend configured the landing page falls back to a built-in project list, so a
fresh clone still renders.

## Docs

- `docs/INFRASTRUCTURE.md`: verified providers, quotas, and fallbacks
- More landing as phases ship: ARCHITECTURE, SECURITY, DATABASE, THEMES, CURRENCY, BACKUPS, runbooks/
