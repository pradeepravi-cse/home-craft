# Backup & Restore

---

## Backup strategy

| Layer | Method | Frequency | Retention | Storage |
|---|---|---|---|---|
| **Database (primary)** | `pg_dump` via GitHub Actions | Daily at 2am UTC (10am MYT) | 30 days rolling | Cloudflare R2 |
| **Database (secondary)** | Supabase built-in backup | Daily | 1 backup (free tier) | Supabase internal |
| **Frontend** | Git history | Every commit | Forever | GitHub |
| **Backend** | Git history + Docker image tags | Every deploy | Forever (git), last N images (GHCR) |GitHub + GHCR |

The primary backup (`pg_dump` to R2) is what you use for restore. The Supabase built-in backup is a secondary safety net.

---

## Backup schedule

The `db-backup.yml` workflow runs automatically:
- **Scheduled:** daily at `0 2 * * *` UTC (2:00 AM UTC = 10:00 AM Malaysia time)
- **Manual:** GitHub → **Actions → Database Backup → Run workflow** → enter optional reason

---

## What is backed up

`pg_dump` with `--format=custom --no-acl --no-owner` captures:
- All table data (customers, orders, measurements, products, inventory, expenses, earnings, audit_logs, etc.)
- All schema (tables, indexes, constraints, enums)
- Sequences (ID counters)

What is NOT backed up (by design):
- Environment variables — stored in Koyeb dashboard and GitHub secrets
- Docker images — always rebuildable from git history

---

## Backup file naming

```
homecraft-YYYYMMDD-HHMMSS.dump.gz
```

Example: `homecraft-20260426-020015.dump.gz`

Files are stored under `backups/` prefix in the R2 bucket.

---

## Verifying backups

To confirm backups are running:
1. Go to GitHub → **Actions → Database Backup** → check the last run status
2. Go to Cloudflare Dashboard → **R2 → homecraft-backups → backups/** → confirm recent files exist

A successful backup run takes ~30 seconds. If a run fails, GitHub Actions sends an error annotation visible in the workflow run log.

---

## Restore procedure

### Scenario A — Restore to existing Supabase database (overwrite)

Use this when data is corrupted or accidentally deleted and you want to roll back.

**Warning:** this overwrites the current database. There is no undo. Take a manual backup first.

```bash
# 1. Download the backup file from R2
# Install AWS CLI if needed: brew install awscli
aws s3 cp \
  "s3://homecraft-backups/backups/homecraft-YYYYMMDD-HHMMSS.dump.gz" \
  ./restore.dump.gz \
  --endpoint-url "https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com"

# 2. Decompress
gunzip restore.dump.gz

# 3. Drop and recreate the database schema
# Connect to Supabase SQL editor or psql and run:
# DROP SCHEMA public CASCADE; CREATE SCHEMA public;

# 4. Restore
pg_restore \
  --dbname="$DATABASE_URL" \
  --no-acl \
  --no-owner \
  --clean \
  --if-exists \
  restore.dump

# 5. Verify
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM customers;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM orders;"
```

### Scenario B — Restore to a fresh Supabase project

Use this when setting up a new environment or migrating.

```bash
# 1–2. Same as Scenario A (download and decompress)

# 3. Restore directly — no need to drop schema (database is empty)
pg_restore \
  --dbname="$NEW_DATABASE_URL" \
  --no-acl \
  --no-owner \
  restore.dump

# 4. Update DATABASE_URL in Koyeb environment variables to point to the new database
# 5. Redeploy the Koyeb service
```

### Scenario C — Point-in-time restore via Supabase

Supabase free tier keeps 1 automatic backup. If a recent change (last 24 hours) broke data:
1. Go to Supabase Dashboard → **Database → Backups**
2. Click **Restore** on the available backup
3. This restores the entire database to that point in time

---

## Manual backup (before risky operations)

Before running destructive operations (bulk deletes, schema migrations, etc.), trigger a manual backup:

1. Go to GitHub → **Actions → Database Backup**
2. Click **Run workflow** → add a reason (e.g. "Before deleting old audit logs")
3. Wait for it to complete (~30 seconds)
4. Proceed with the operation

---

## Disaster recovery timeline

| Event | Recovery action | Time to restore |
|---|---|---|
| Accidental row deletion | Restore from last R2 backup | ~5 minutes |
| Database corruption | Restore from last R2 backup | ~5 minutes |
| Supabase project deleted | Restore to new Supabase project from R2 | ~15 minutes |
| Render service down | Redeploy via Render dashboard or GitHub Actions | ~4 minutes |
| Frontend broken | Revert commit → auto-redeploys via GitHub Actions | ~3 minutes |
| Backend broken | Revert commit → auto-redeploys via GitHub Actions | ~5 minutes |
| Complete outage (all services) | Restore DB to new Supabase, redeploy backend, redeploy frontend | ~25 minutes |

---

## R2 storage usage

Each backup is approximately 1–5 MB compressed for a personal-scale database.
At 30 days retention: 30 × 5 MB = ~150 MB maximum.
Cloudflare R2 free tier: 10 GB. Current usage is well within limits.
