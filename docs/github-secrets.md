# GitHub Secrets Reference

Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

---

## Cloudflare (frontend deploy)

| Secret | Description | Where to get it |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages edit permission | Cloudflare Dashboard → **My Profile → API Tokens → Create Token** → use "Edit Cloudflare Pages" template |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Cloudflare Dashboard → any page → right sidebar, or R2 overview page |
| `CLOUDFLARE_PAGES_PROJECT_NAME` | The name of your Pages project | Cloudflare Dashboard → **Workers & Pages** → your project name (e.g. `homecraft`) |
| `VITE_API_URL` | Full URL of your Koyeb backend | e.g. `https://homecraft-xxxx.koyeb.app` (no trailing slash) |

---

## Render (backend deploy)

| Secret | Description | Where to get it |
|---|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render deploy hook URL (includes auth token) | Render Dashboard → your service → **Settings → Deploy Hook** → copy URL |

---

## Supabase (database backup)

| Secret | Description | Where to get it |
|---|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string | Supabase Dashboard → **Settings → Database → Connection Pooling → Session mode (port 5432)** — use the pooler URL (`aws-0-region.pooler.supabase.com`), NOT the direct URL (`db.xxxx.supabase.co`) — Render free tier cannot reach IPv6 |

---

## Cloudflare R2 (backup storage)

| Secret | Description | Where to get it |
|---|---|---|
| `R2_ACCESS_KEY_ID` | R2 API token access key | Cloudflare Dashboard → **R2 → Manage R2 API Tokens** → your token → Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret | Same token creation page — only shown once, save immediately |
| `R2_BUCKET_NAME` | R2 bucket name | `homecraft-backups` (created in Step 6) |

Note: `CLOUDFLARE_ACCOUNT_ID` is shared — already listed under Cloudflare above and also used for R2 endpoint construction in the backup workflow.

---

## Full secrets checklist

- [ ] `CLOUDFLARE_API_TOKEN`
- [ ] `CLOUDFLARE_ACCOUNT_ID`
- [ ] `CLOUDFLARE_PAGES_PROJECT_NAME`
- [ ] `VITE_API_URL`
- [ ] `RENDER_DEPLOY_HOOK_URL`
- [ ] `DATABASE_URL`
- [ ] `R2_ACCESS_KEY_ID`
- [ ] `R2_SECRET_ACCESS_KEY`
- [ ] `R2_BUCKET_NAME`

---

## Notes

- `GITHUB_TOKEN` is **not** listed here — it is provided automatically by GitHub Actions and does not need to be added manually. It is used to push Docker images to GHCR and to post deployment comments on PRs.
- Secrets are never printed in logs. If a workflow fails and you need to debug, check that the secret value has no leading/trailing whitespace when copied.
- If you rotate any secret (e.g. `JWT_SECRET`), update it both in GitHub secrets and in the Koyeb environment variables — the two copies must stay in sync for the backend to work correctly.
