# Architecture

## System diagram

```
Developer
    │
    │  git push main
    ▼
GitHub Repository
    │
    ├──── frontend/** changed ──────────────────────────────────────────────┐
    │     GitHub Actions: deploy-frontend.yml                               │
    │     1. pnpm install + vite build (injects VITE_API_URL)               │
    │     2. cloudflare/pages-action deploys dist/                          │
    │                                                                        ▼
    │                                                             Cloudflare Pages
    │                                                             React SPA
    │                                                             https://homecraft.pages.dev
    │
    ├──── backend/** changed ───────────────────────────────────────────────┐
    │     GitHub Actions: deploy-backend.yml                                │
    │     1. pnpm install + nest build (type-check)                         │
    │     2. POST RENDER_DEPLOY_HOOK_URL → triggers Render build            │
    │                                                                        ▼
    │                                                             Render (Free)
    │                                                             NestJS API
    │                                                             https://homecraft.onrender.com
    │                                                                        │
    │                                                                        │ DATABASE_URL
    │                                                                        ▼
    │                                                             Supabase (Free)
    │                                                             PostgreSQL 16
    │                                                             Singapore region
    │
    └──── Daily 2am UTC ────────────────────────────────────────────────────┐
          GitHub Actions: db-backup.yml                                      │
          1. pg_dump Supabase → .dump                                        │
          2. gzip compress                                                    │
          3. aws s3 cp → Cloudflare R2                                       │
          4. prune backups older than 30 days                                ▼
                                                                  Cloudflare R2
                                                                  homecraft-backups/
                                                                  30-day rolling window
```

## Services

| Service | Role | URL |
|---|---|---|
| Cloudflare Pages | React SPA hosting, global CDN, HTTPS | `https://homecraft.pages.dev` |
| Render | NestJS API, Docker container, free web service | `https://homecraft.onrender.com` |
| Supabase | PostgreSQL 16, managed, daily backups | `db.xxxx.supabase.co` |
| Cloudflare R2 | Backup storage, S3-compatible | `homecraft-backups` bucket |

## Request flow

```
User on phone
    │  HTTPS
    ▼
Cloudflare Pages (CDN edge)
    │  Serves React SPA (static files)
    │
    │  App makes API calls to VITE_API_URL
    │  HTTPS
    ▼
Render (NestJS)
    │  JWT auth check
    │  Business logic
    │  TypeORM queries
    │  HTTPS / TLS
    ▼
Supabase PostgreSQL
```

Note: Nginx is no longer in the path. Cloudflare Pages and Render each handle their own TLS and routing directly.

## Free tier limits

| Service | Limit | Current usage estimate |
|---|---|---|
| Cloudflare Pages | 500 builds/month, 100 GB bandwidth | < 30 builds/month, < 1 GB |
| Render | 750 free instance hours/month, sleeps after 15 min idle | Keepalive worker prevents sleep |
| Supabase | 500 MB database, pauses after 7 days inactivity | < 50 MB for personal use |
| Cloudflare R2 | 10 GB storage, 1M Class A ops/month, 10M Class B ops/month | ~30 MB/day × 30 = ~1 GB |

## Render sleep behaviour

Render's free web service spins down after **15 minutes of no inbound HTTP traffic**.
The first request after sleep triggers a cold start of approximately **30–60 seconds**.

Mitigation: The Cloudflare keepalive worker (cron `*/14 * * * *` — every 14 minutes) pings both
`/health` on Render and the Supabase DB, keeping both services warm at all times.
See [deployment-setup.md](deployment-setup.md) — Step 5.

## Supabase inactivity pause

Supabase pauses free projects after **7 consecutive days of no database activity**.
The same keepalive worker that prevents Render sleep also keeps Supabase warm.

## Rollback strategy

Render deploys are triggered via a deploy hook which pulls the latest `main` branch.
To roll back: revert the commit in git and push to main — GitHub Actions triggers a fresh deploy
of the reverted state automatically.

## Local development

Local dev is unchanged — Docker Compose still runs everything locally:

```bash
docker compose up -d
```

The cloud setup is parallel infrastructure. No local changes are needed.
