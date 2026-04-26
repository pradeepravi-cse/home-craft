# Deployment Setup Guide

One-time setup. Follow steps in order — each step's output feeds into the next.

---

## Step 1 — Supabase (database) ~10 min

1. Go to https://supabase.com → **New project**
2. Name: `homecraft`
3. Region: **Southeast Asia (Singapore)** — closest to Malaysia
4. Set a strong database password — save it in a password manager
5. Wait ~2 minutes for provisioning

6. Go to **Settings → Database → Connection string**
7. Find the **Connection Pooling** section → select **Session mode (port 5432)**
   - The host will be `aws-0-ap-southeast-1.pooler.supabase.com` (not `db.xxxx.supabase.co`)
   - Do NOT use the direct connection URL — it resolves to IPv6 which Render's free tier cannot reach
   - Do NOT use Transaction mode (port 6543) — it breaks TypeORM prepared statements
8. Copy the session pooler connection string:
   ```
   postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```
9. Save this as `DATABASE_URL` — needed in Step 2 and Step 6 (GitHub secrets)

> NestJS `synchronize: true` will create all tables on first boot. No SQL scripts to run.

---

## Step 2 — Render (backend) ~10 min

1. Go to https://render.com → **Sign up with GitHub** (no credit card needed)
2. **New → Web Service**
3. Connect your GitHub repository
4. Configure:

   | Setting | Value |
   |---|---|
   | Name | `homecraft-api` |
   | Region | Singapore (Southeast Asia) |
   | Branch | `main` |
   | Root Directory | `backend` |
   | Runtime | **Docker** |
   | Dockerfile Path | `./Dockerfile` |

5. Set environment variables (click **Add Environment Variable** for each):

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `DATABASE_URL` | your Supabase connection string from Step 1 |
   | `JWT_SECRET` | generate with: `openssl rand -hex 32` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `ADMIN_EMAIL` | your email address |
   | `ADMIN_PASSWORD` | your strong admin password |
   | `ADMIN_NAME` | your name |
   | `LOG_LEVEL` | `info` |
   | `FRONTEND_URL` | leave blank for now — fill in after Step 3 |

6. **Instance type:** Free
7. Click **Create Web Service** → wait ~4 minutes for first build

8. Test: open `https://homecraft-api.onrender.com/health` → should return `{"status":"ok"}`
9. Save your Render URL (e.g. `https://homecraft-api.onrender.com`) — needed for Step 3 and Step 5

10. **Disable Render's auto-deploy** (GitHub Actions will control deploys instead):
    Go to your service → **Settings → Build & Deploy → Auto-Deploy → Disable**

11. Get the deploy hook URL:
    Go to **Settings → Deploy Hook** → copy the URL
    This is your `RENDER_DEPLOY_HOOK_URL` secret (contains auth — treat it as a password)

---

## Step 3 — Cloudflare Pages (frontend) ~10 min

1. Go to https://dash.cloudflare.com → **Workers & Pages → Pages → Create**
2. **Connect to Git** → select your GitHub repository
3. Configure build settings:

   | Setting | Value |
   |---|---|
   | Framework preset | None |
   | Root directory | `frontend` |
   | Build command | `pnpm install && pnpm run build` |
   | Build output directory | `dist` |

4. Add environment variable:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://homecraft-api.onrender.com` (your Render URL from Step 2) |

5. Click **Save and Deploy** → wait ~2 minutes
6. Note your Pages URL: `https://homecraft-xxxx.pages.dev`

7. (Optional) Add a custom domain under **Custom domains** in the Pages project settings

8. Go back to Render → your service → **Environment**
   Update `FRONTEND_URL` to your Pages URL (e.g. `https://homecraft-xxxx.pages.dev`)
   If you have a custom domain: `https://homecraft-xxxx.pages.dev,https://yourdomain.com`

---

## Step 4 — Keepalive worker ~5 min

Prevents two things simultaneously:
- Render sleeping after 15 minutes of inactivity (cold start ~30–60 seconds)
- Supabase pausing after 7 days of inactivity

1. Go to Cloudflare Dashboard → **Workers & Pages → Workers → Create a Worker**
2. Name it `homecraft-keepalive`
3. Replace the default code with:

```javascript
export default {
  async scheduled(event, env) {
    const res = await fetch('https://homecraft-api.onrender.com/health');
    console.log(`Keepalive: ${res.status}`);
  },
  async fetch(request) {
    return new Response('HomeCraft keepalive worker');
  }
};
```

4. Replace `homecraft-api.onrender.com` with your actual Render URL
5. Click **Deploy**
6. Go to **Settings → Triggers → Add Cron Trigger**
7. Cron expression: `*/14 * * * *` (every 14 minutes — keeps Render awake before the 15-min sleep threshold)
8. Save

> The 14-minute interval also satisfies the Supabase keepalive requirement (7-day inactivity threshold).

---

## Step 5 — Cloudflare R2 (backup storage) ~5 min

1. Go to Cloudflare Dashboard → **R2 Object Storage → Create bucket**
2. Bucket name: `homecraft-backups`
3. Region: automatic (Cloudflare picks closest)

4. Go to **R2 → Manage R2 API Tokens → Create API Token**
5. Permissions: **Object Read & Write**
6. Scope: specific bucket → `homecraft-backups`
7. Create token → save:
   - `Access Key ID` → this is `R2_ACCESS_KEY_ID`
   - `Secret Access Key` → this is `R2_SECRET_ACCESS_KEY`

8. Note your Cloudflare Account ID (shown on the R2 overview page and in every dashboard URL)
   → this is `CLOUDFLARE_ACCOUNT_ID`

---

## Step 6 — GitHub secrets ~10 min

Go to your GitHub repository → **Settings → Secrets and variables → Actions → New repository secret**

Add every secret from [github-secrets.md](github-secrets.md).

After adding all secrets, trigger a manual deploy to verify everything works:
- Go to **Actions → Deploy Frontend → Run workflow**
- Go to **Actions → Deploy Backend → Run workflow**
- Go to **Actions → Database Backup → Run workflow**

---

## Step 7 — First login

1. Open your Cloudflare Pages URL
2. You will see the HomeCraft login page
3. The admin account was created automatically when Koyeb booted (from `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars)
4. Log in with those credentials

---

## Ongoing

From this point, every `git push` to `main` automatically:
- Deploys the frontend if `frontend/` changed
- Rebuilds and deploys the backend if `backend/` changed
- Backs up the database daily at 2am UTC
