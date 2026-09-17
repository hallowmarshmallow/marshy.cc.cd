# Infrastructure Matrix

Rule: no infrastructure decision is committed until its row has a `Verified on` date
within the last 30 days and an official documentation URL.

| Provider | Service | Current free tier | Key quotas | Restrictions | Verified on | Doc URL | Fallback | Migration notes |
|---|---|---|---|---|---|---|---|---|
| GitHub | Pages (frontend hosting) | Free for public repos | ~1 GB site, ~100 GB/mo soft bandwidth, 10 builds/hr | Static files only; no server code | 2026-09-02 | https://docs.github.com/en/pages | Cloudflare Pages | Re-point DNS; build artifact identical |
| GitHub | Actions (CI/CD) | Free for public repos | Generous minutes on public repos | Standard usage limits | 2026-09-02 | https://docs.github.com/en/actions | Local scripts | n/a |
| Supabase | Postgres + Auth + Storage + Realtime | Free plan | ~500 MB DB, 1 GB storage, 5 GB egress, 50k MAU, 2 projects max; projects auto-pause after ~7 days of database inactivity | A paused project is an outage until restored from the dashboard | 2026-09-02 (pricing page plus 2026-06/07/08 third-party guides) | https://supabase.com/pricing | Firebase Spark; self-hosted PocketBase | `pg_dump` export (`scripts/export.mjs`, to be built) |
| DNSHE | `marshy.cc.cd` subdomain + DNS | Free | Per DNSHE terms | Free domains may need periodic renewal; confirm in the DNSHE panel | 2026-09-02 (delegation verified live: `cc.cd` NS to a/b.ns.dnshe.org; `marshy.cc.cd` does not resolve) | https://www.dnshe.com/ , https://www.dnshe.com/tos.html | Paid domain, ~$10/yr | Add a CNAME/A record for `marshy` pointing at GitHub Pages; DNS TTL is minutes |
| (unused) | Sentry, error tracking | ~5k errors/mo | n/a | n/a | not adopted | https://sentry.io/pricing/ | GlitchTip | Add in a later phase |
| (unused) | UptimeRobot, uptime | ~50 monitors at 5min | n/a | n/a | not adopted | https://uptimerobot.com | Manual checks | Add at public launch |
| (unused) | Backblaze B2 / Cloudflare R2, backup and media tier | R2 ~10 GB free, zero egress | n/a | n/a | not adopted | https://www.backblaze.com/cloud-storage/pricing , https://developers.cloudflare.com/r2/ | n/a | Add when media volume justifies it |

## Standing actions

- **Weekly:** record a `platform_metrics` snapshot next to this table, check Supabase
  usage in the dashboard, and confirm the Supabase project has not paused.
- **Anti-pause heartbeat:** `.github/workflows/heartbeat.yml` runs Mon and Thu at
  12:00 UTC and fires a real SELECT at the database through the anon key, resetting
  Supabase's idle-pause clock. Keys come from the `github-pages` environment secrets.
  A red run means the project paused or the keys are stale; check immediately.
- **Quarterly:** re-verify every row against its doc URL, update `Verified on` dates,
  and rotate OAuth secrets where the provider allows it.
- **Threshold policy:** at 50% usage log only; at 75% open an optimization task; at 90%
  page the owner; at 100% follow the runbook. Never auto-upgrade to paid.

## Known open items

- [ ] **DNS record not yet created.** `marshy.cc.cd` does not resolve (ENOTFOUND as of
      2026-09-02). An owner must add the record in the DNSHE panel pointing `marshy` at
      the Pages URL. Until then the site lives at `hallowmarshmallow.github.io/marshy.cc.cd/`.
- [ ] **GitHub Pages not yet enabled.** Set Settings → Pages → Source to *GitHub Actions*
      on the first deploy.
- [ ] **Supabase project not yet created.** Free and owner-owned. Paste the URL and anon
      key into the repo secrets for CI and into `.env` locally.
- [ ] **DNSHE renewal policy.** Confirm whether `marshy.cc.cd` needs periodic renewal in
      the DNSHE panel and document the cadence here.
