# Infrastructure Matrix (§5.4)

Rule V1: no infrastructure decision is committed until its row has a `Verified on` date ≤ 30 days old and an official documentation URL.

| Provider | Service | Current free tier | Key quotas | Restrictions | Verified on | Doc URL | Fallback | Migration notes |
|---|---|---|---|---|---|---|---|---|
| GitHub | Pages (frontend hosting) | Free for public repos | ~1 GB site, ~100 GB/mo soft bandwidth, 10 builds/hr [LK] | Static files only; no server code | **2026-09-02** | https://docs.github.com/en/pages | Cloudflare Pages | Re-point DNS; build artifact identical |
| GitHub | Actions (CI/CD) | Free for public repos | Generous minutes on public repos [LK] | Standard usage limits | **2026-09-02** | https://docs.github.com/en/actions | Local scripts | n/a |
| Supabase | Postgres + Auth + Storage + Realtime | Free plan | ~500 MB DB, 1 GB storage, 5 GB egress, 50k MAU, 2 projects max; **projects auto-pause after ~7 days of database inactivity** | Paused project = outage until restored from dashboard | **2026-09-02** (pricing page + 2026-06/07/08 third-party guides) | https://supabase.com/pricing | Firebase Spark; PocketBase self-host | `pg_dump` export via §15.4 `scripts/export.mjs` (to be built) |
| DNSHE | `marshy.cc.cd` subdomain + DNS | Free | Per DNSHE terms | Free domains may require periodic renewal — **confirm in the dnshe panel [A]** | **2026-09-02** (delegation verified live: `cc.cd` NS → a/b.ns.dnshe.org; `marshy.cc.cd` currently does NOT resolve) | https://www.dnshe.com/ , https://www.dnshe.com/tos.html | Real domain ~$10/yr [R long-term] | Add CNAME/A record for `marshy` → GitHub Pages; DNS TTL ~minutes |
| (unused) | Sentry — error tracking | ~5k errors/mo [LK] | — | — | not yet adopted | https://sentry.io/pricing/ | GlitchTip | Add with Phase 6+ |
| (unused) | UptimeRobot — uptime | ~50 monitors @5min [LK] | — | — | not yet adopted | https://uptimerobot.com | Manual checks | Add at public launch |
| (unused) | Backblaze B2 / Cloudflare R2 — backup/media tier | R2 ~10 GB free, zero egress [LK] | — | — | not yet adopted | https://www.backblaze.com/cloud-storage/pricing , https://developers.cloudflare.com/r2/ | — | Add when media volume justifies (§15.3 stage 3) |

## Standing actions

- **Weekly:** record `platform_metrics` snapshot next to this table; check Supabase usage in the dashboard; **confirm the Supabase project has not paused** (heartbeat cron lands with Phase 2).
- **Anti-pause heartbeat:** `.github/workflows/heartbeat.yml` runs Mon + Thu 12:00 UTC and fires a real SELECT at the DB via the anon key (RLS-public `profiles` read), resetting Supabase's ~7-day idle-pause clock. Keys come from the `github-pages` environment secrets. Red run = project paused or keys stale — check immediately.- **Quarterly:** re-verify every row against its doc URL; update `Verified on` dates; rotate OAuth secrets where providers allow.
- **Threshold policy (§5.4):** ≤50% → log only · 75% → optimization task · 90% → owner paged, §16 Stage 1–2 · 100% → runbook, never auto-upgrade to paid.

## Known open items

- [ ] **DNS record not yet created** — `marshy.cc.cd` does not resolve (ENOTFOUND as of 2026-09-02). Owner must add the record in the DNSHE panel pointing `marshy` at the Pages URL. Until then the site lives at `hallowmarshmallow.github.io/marshy.cc.cd/`.
- [ ] **GitHub Pages not yet enabled** — flip Settings → Pages → Source: *GitHub Actions* on first deploy.
- [ ] **Supabase project not yet created** — free, owner-owned; paste URL + anon key into repo secrets for CI and `.env` locally.
- [ ] **DNSHE renewal policy** — confirm whether `marshy.cc.cd` needs periodic renewal in the dnshe panel and document the cadence here.
