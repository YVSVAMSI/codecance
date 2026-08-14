# Production Deployment & Operations Guide

This document is the companion to local development. It covers the production
architecture, every environment variable, the database migration flow, host
configuration, backups, security checklist, and the launch checklist.
The spec's deliverables 1-9 are covered here.

---

## 1. Architecture

```
Browser (React SPA, built to dist/)
   │  same-origin HTTPS, HttpOnly cookie (no localStorage token)
   ▼
Cloudflare Pages / Vercel (static files: dist/)     ← frontend host
   │  API requests are SAME-ORIGIN: build is served BY the API server
   ▼
Render / Railway (Node 20, `npm start`)              ← backend host
   │  express + helmet + rate-limit; serves dist/ + /api
   ▼
Neon (managed PostgreSQL)                             ← database
   Prisma migrate deploy (NOT db push)
```

Two deploy shapes are supported:

- **A) Single server (recommended to start):** Render/Railway runs the API and
  serves the built `dist/` on the same origin. No CORS needed in production;
  cookies flow same-origin. `CORS_ORIGIN` can equal the app URL or be ignored.
- **B) Split frontend:** deploy `dist/` to Cloudflare Pages/Vercel and the API
  separately. Then set `CORS_ORIGIN=https://your-app-domain.com`, ensure the
  API domain has a matching secure cookie config, and proxy `/api` to the API
  host from the Pages/Vercel function proxy.

Cookies are `HttpOnly`, `Secure` (auto-on in production), `SameSite=Lax`.
JWTs live only in that cookie; the role is re-read from the DB on every request
(so role changes and account disabling take effect immediately).

---

## 2. Environment variables

All values live in the server's environment. `.env` is never committed
(see `.gitignore`); a template is in `.env.example`.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✓ | Postgres connection string, e.g. Neon `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | ✓ | Long random string (`openssl rand -hex 48`). Rotate by setting a new value; all sessions then invalidate. |
| `PORT` | ✓ | Backend port. Render free/Railway set their own; default 5050 dev, 8080 prod. |
| `NODE_ENV` | ✓ | `production` on deploy. Turns on: Secure cookie, CSP headers, dist serving, fail-fast env checks. |
| `COOKIE_SECURE` | – | `true` to force Secure cookie in non-prod contexts. Auto-true when `NODE_ENV=production`. |
| `COOKIE_NAME` | – | Cookie name (default `dsa_token`). |
| `JWT_EXPIRES_IN` | – | Default `30d`. |
| `CORS_ORIGIN` | – | Comma-separated origins allowed (used only for non-same-origin frontends). Default `http://localhost:5173`. |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | – | Global API rate limit (default 200/min). |
| `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX` | – | Login/signup rate limit (default 10/min/IP). |

Generate secrets with:
```bash
openssl rand -hex 48
```

---

## 3. Database → production migration (DO NOT use `prisma db push`)

Local dev uses the Postgres instance in `docker-compose.yml`. Migrations are
versioned in `prisma/migrations/` and applied with `prisma migrate deploy`.

```bash
# 1) Local: start Postgres and create/apply migrations
docker compose up -d db
npx prisma migrate dev          # applies prisma/migrations/20260814175526_init

# 2) Production (Render/Railway build step or one-off):
DATABASE_URL="<neon-url>" npx prisma migrate deploy
```

On first production boot the server auto-seeds the **global A2Z curriculum**
(24 topics / ~254 patterns, once) and the **Pattern Hunt bank** (500 problems,
idempotent). No per-user seeding exists anymore, so a 10k-user database stays
small.

Existing users on the old SQLite/Neon schema are **not** auto-migrated — this
schema change is a clean start. If old data must be preserved, export before
switching (see §7) and re-import, or contact for a one-off data port.

---

## 4. Host configuration

### Backend — Render (free tier spins down ~50s idle; prod `$7/mo` always-on)
- Build: `npm ci && npm run build && npx prisma generate`
- Start: `npm start`  (runs `NODE_ENV=production`)
- Apply migrations: Shell script/one-off job with `npx prisma migrate deploy`
- Set all env vars from §2. `PORT` = whatever Render assigns.

### Backend — Railway ($5/mo after 1 free trial month)
- Same build/start commands. Railway sets `PORT`. Add `prisma migrate deploy`
  as a start command wrapper or a one-off command before `npm start`.

### Frontend — Cloudflare Pages or Vercel (split setup, shape B)
- Build output dir: `dist`, build command `npm run build`
- Add `/_worker` or `vercel.json` rewrite so `/api/*` proxies to the API
  origin. Set `CORS_ORIGIN` to the frontend URL and ensure the API cookie
  `__Secure-` prefix or `COOKIE_SECURE=true` is used.

### Database — Neon (managed Postgres)
- Free: 0.5 GB storage, scale-to-zero (~570 ms wake), 6-hour point-in-time
  history. Create a project, copy the pooled `DATABASE_URL` (ssl).
- Apply migrations from a shell job: `npx prisma migrate deploy`.

---

## 5. Security checklist (implemented + what you keep doing)

Implemented in code:
- [x] Helmet security headers; CSP on in production
- [x] JWT replaced: HttpOnly + Secure + SameSite=Lax cookie, no localStorage
- [x] Admin is DB-role based (`role = 'ADMIN'`), never email-substring, never UI-only
- [x] Role re-checked from DB per request; disabled users blocked at auth
- [x] Rate limiting: global + tighter on login/signup
- [x] CORS allowlist (never `*`), `trust proxy`, 100kb body cap
- [x] Central error handler — no stack traces/leaks in production
- [x] AuditLog on login/signup, admin list/disable/delete/role-change,
      custom-topic/pattern delete
- [x] IDOR: every query scoped by `userId`; global topics/patterns cannot be
      deleted by users; custom deletes verify ownership
- [x] Account deletion cascade purges all user rows (questions, attempts,
      revisions, settings, custom topics/patterns)

Ongoing operational checklist:
- [ ] Rotate `JWT_SECRET` immediately if ever leaked (invalidates all sessions)
- [ ] Keep Neon "history" enabled and nightly backups (see §7)
- [ ] Watch Neon storage; set alerts at ~80%
- [ ] Add Sentry (free) to the server entry if you want error alerts
- [ ] Review AuditLog table monthly; alert on repeated `ADMIN.USER_LIST`

---

## 6. Admin access model

- Promotion to admin is a **database write**: `UPDATE "User" SET role='ADMIN' WHERE email='...'`
  (only server/DB access can grant admin; no self-serve endpoint).
- Enforced server-side by `requireRole('ADMIN')` on `/api/admin/*`.
- The UI hides the admin panel unless `user.role === "ADMIN"`; hiding is
  cosmetic — the API is the real gate.
- Admin can: list/search users (`/api/admin/users?q=`), disable/enable
  (`PATCH /api/admin/users/:id`), change role, and delete a user
  (`DELETE /api/admin/users/:id`) which cascades their data.
- Every admin action is written to `AuditLog` (actor, action, target, IP,
  non-sensitive metadata).
- An admin cannot disable or delete their own account through these endpoints.

## 7. User-data access & backup model

Data the operator can access:
- An operator with DB/Neon access can query user rows; this is the same as any
  self-hosted app. Emails + hashed passwords + progress metrics.
- Passwords are `bcrypt` (cost 12). The app stores no other PII.
- Account deletion (`/api/auth/delete-account` or admin delete) removes:
  Questions, Attempts, Revisions, Settings, custom Topics/Patterns, and the
  User row. Global curriculum and Pattern Hunt bank are never touched.
- AuditLog rows remain for accountability (they reference the user id, not email).

Backups (Neon host):
- Neon keeps ~6 hours of PITR automatically.
- Add a nightly `pg_dump` job (GitHub Actions cron / Render cron job) to Backblaze
  B2 or Cloudflare R2 (free-tier friendly):
  ```bash
  pg_dump "$DATABASE_URL" | gzip > dsa_$(date +%F).sql.gz
  ```
- Restore drill: restore a dump into a throwaway Neon branch quarterly.
  Keep just the conversation history + serialized `pg_dump`; do not store dumps
  in the app repo.

---

## 8. Launch checklist

Before go-live:
- [ ] `npm ci && npm run build && npx prisma migrate deploy` all pass with prod `DATABASE_URL`
- [ ] `NODE_ENV=production` set; `COOKIE_SECURE` effective (verify via browser devtools cookie flags)
- [ ] `JWT_SECRET` is a fresh `openssl rand -hex 48` value (not the sample)
- [ ] Sign up two test accounts; verify `/api/data` returns the 24 global topics + ~254 patterns
- [ ] Verify a disabled user gets `Account is disabled` and cannot call `/api/*`
- [ ] Verify logout clears the cookie and `/api/auth/me` returns 401
- [ ] Verify cross-user protection: user A cannot read/modify user B's question ids (they 404)
- [ ] Confirm non-admin gets 403 on `/api/admin/*`; only DB-promoted admin succeeds
- [ ] Confirm admin delete of a user removes their rows (check table counts)
- [ ] UptimeRobot / Healthchecks ping set on the API host
- [ ] Neon nightly backup job scheduled; restore drill performed once
- [ ] `.env` not committed; secrets only in host env config
- [ ] HTTPS enforced at host (Render/Railway/Pages all provide certs)

---

## 9. Local dev quickstart (unchanged, now Postgres-backed)

```bash
docker compose up -d db
npx prisma migrate dev
npm run dev        # API :5050, client :5173
```

README.md at the repo root holds the original feature guide and API table.