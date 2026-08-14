# CodeCance — DSA Pattern Tracker

A full-stack spaced-repetition tracker for mastering Data Structures & Algorithms. It combines a complete A2Z DSA roadmap, a 500+ problem "Pattern Hunt" with semantic pattern-recognition feedback, and a configurable revision engine that schedules when each question should be revisited.

> **Production:** see [PRODUCTION.md](./PRODUCTION.md) for deployment, env vars, DB migration, backups, and the security/launch checklists.

## Features

- **A2Z Roadmap** — 24 topics and ~250 global patterns shared across all accounts (Arrays, Binary Search, Graphs, DP, etc.).
- **Pattern Hunt** — 500+ FAANG/Tier-1 problems with LeetCode-style search & filter bar. Solve a problem, guess its hidden pattern, and get instant semantic evaluation of whether your approach is valid (correct / incorrect / valid alternative).
- **Question Tracker** — LeetCode-style search + filter pills (topics, patterns, difficulty, status, confidence, due status, sort) for every logged question.
- **Spaced Repetition** — each solved question is rated Green / Yellow / Red and scheduled for revision (configurable intervals + growth factor). A revision engine prioritizes overdue items.
- **Daily Revision Queue** — a focused "today" view of everything due or overdue, with a daily streak counter.
- **Roadmap & Patterns pages** — per-topic pages with live pattern performance reports and exact question counts.
- **Dashboard & Analytics** — progress, coverage, confidence distribution, weak vs. mastered patterns, activity charts.
- **Email verification** — new accounts sign up with their full name, email & password, then confirm a 6-digit OTP emailed via Resend before they can log in (resend + cooldown + attempt limits built in).
- **Settings** — revision-algorithm tuning (intervals, growth factor, mastery thresholds) and CSV/Excel export.
- **Admin panel** — role-gated user management: search users, disable/enable accounts, change role, delete a user (cascades their data). Every admin action is audit-logged; only accounts promoted to `role = 'ADMIN'` in the DB can access it.

## Tech Stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Frontend  | React 18, Vite 5, Tailwind CSS, Recharts, lucide-react, xlsx |
| Backend   | Node.js, Express 4, helmet, express-rate-limit |
| Database  | PostgreSQL via Prisma ORM 5                  |
| Auth      | JWT in HttpOnly cookies (Secure, SameSite=Lax) + bcryptjs |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Docker (for the local PostgreSQL database) **or** a local PostgreSQL server

### Installation

```bash
npm install
```

### Database setup

The app uses **PostgreSQL** (required — the schema no longer targets SQLite).
The connection string lives in `.env` (`DATABASE_URL=...`, see `.env.example`).

Start a local Postgres and apply the versioned migration:

```bash
docker compose up -d db       # or point DATABASE_URL at your own Postgres
npm run db:migrate            # prisma migrate dev (applies prisma/migrations/)
npm run prisma:generate
```

The server seeds the global A2Z roadmap and Pattern Hunt bank automatically on
first boot (idempotent).

### Running

```bash
npm run dev
```

This starts both processes concurrently:

- **React client** — http://localhost:5173 (open this in your browser)
- **Express API** — http://localhost:5050

> **Note:** The API runs on port **5050**, not 5000. macOS uses port 5000 for AirPlay Receiver, which conflicts with Node. The Vite dev server proxies `/api` to `http://localhost:5050`.

### Production build

```bash
npm run build
```

The built app is emitted to `dist/`. In production mode (`NODE_ENV=production`), the Express server also serves the static files from `dist/`.

## How it works

1. **Sign up** — a secure account is created (JWT set in an HttpOnly cookie; no token in localStorage). The A2Z roadmap and Pattern Hunt problems are shared global content, auto-seeded once; your own settings and questions are created as you go.
2. **Pattern Hunt** — pick a problem (or use the random picker), solve it on LeetCode, then type the pattern you think it uses. The server's semantic evaluator compares your answer against the problem's hidden pattern and reports whether your approach is valid.
3. **Log the attempt** — you must rate the question **Green / Yellow / Red**. The rating drives the revision schedule:
   - Green → next revision in ~7 days
   - Yellow → ~3 days
   - Red → ~1 day
   (These intervals are configurable in Settings.)
4. **Revise** — use the Daily Revision Queue or Revision Planner to work through due items. Logging a revision advances the schedule and grows future intervals by the growth factor.
5. **Track** — monitor coverage, mastery, weak spots, and streaks on the Dashboard / Analytics.

## Project Structure

```
├── src/                  # React frontend (single-page app)
│   ├── App.jsx           # All UI, state, and hooks
│   ├── main.jsx
│   └── index.css
├── server/               # Express backend
│   ├── index.js          # Server entry (helmet, CORS, rate limits, dist serving)
│   ├── config.js         # Env-driven config + fail-fast in production
│   ├── audit.js          # AuditLog writer
│   ├── routes/
│   │   ├── auth.js       # Signup / login / logout / JWT-cookie auth / RBAC
│   │   └── tracker.js    # Data, pattern hunt, questions, revisions, settings, admin
│   ├── seedRoadmap.js    # Global A2Z roadmap seed (topics + patterns)
│   ├── seedPatternHunt.js# 500+ Pattern Hunt problem bank
│   └── semanticEvaluator.js # Pattern-recognition evaluation engine
├── prisma/
│   ├── schema.prisma     # Database schema (PostgreSQL)
│   └── migrations/       # Versioned migrations (prisma migrate)
├── .env                  # DATABASE_URL, JWT_SECRET, PORT (never committed)
├── .env.example          # Template with comments
├── docker-compose.yml    # Local PostgreSQL
├── vite.config.js        # Vite + proxy config
└── package.json
```

## Configuration (`.env`)

See `.env.example` for the full list. Minimum:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/dsa_tracker?schema=public"
JWT_SECRET="<long random string — openssl rand -hex 48 in production>"
PORT=5050
# Email verification via Resend. Leave blank in dev -> OTP prints to the server console.
RESEND_API_KEY=""                # e.g. re_... (required in production)
EMAIL_FROM="CodeCance <onboarding@resend.dev>"
```

## Admin Access

The admin panel (in **Settings**) is shown only when `user.role === "ADMIN"`.
Admins are promoted by a **database write** — there is no self-serve endpoint:

```sql
UPDATE "User" SET role='ADMIN' WHERE email='you@example.com';
```

Admin actions (list/search, disable/enable, role change, delete user) are
enforced server-side with `requireRole('ADMIN')` and recorded in the AuditLog.

## API Overview

Auth uses an **HttpOnly, Secure, SameSite=Lax cookie** (no `Authorization`
header, no localStorage). New accounts are **email-verified**: signup captures
a full name + email + password, then a 6-digit OTP is emailed (via **Resend**)
and the account activates only after the code is confirmed. In local dev
without `RESEND_API_KEY`, the OTP is printed to the server console.
All `/api/*` routes except the auth calls below require a valid session cookie.

| Method | Route                        | Description                             |
|--------|------------------------------|-----------------------------------------|
| POST   | `/api/auth/signup`           | Create a pending account (name, email, password) + email an OTP |
| POST   | `/api/auth/verify`           | Confirm the emailed 6-digit OTP (activates account, sets cookie) |
| POST   | `/api/auth/resend-otp`       | Request a new code (60s cooldown, rate-limited) |
| POST   | `/api/auth/login`            | Log in (rejects unverified accounts), sets session cookie |
| POST   | `/api/auth/logout`           | Clear session cookie                    |
| GET    | `/api/auth/me`               | Current user (id, name, email, role, verified) |
| DELETE | `/api/auth/delete-account`   | Delete account and all user data        |
| GET    | `/api/data`                  | Topics, patterns, questions, revisions, settings |
| GET    | `/api/pattern-hunt`          | Pattern Hunt problems + user progress   |
| POST   | `/api/pattern-hunt/submit`   | Log an attempt with semantic evaluation |
| POST   | `/api/topics`                | Add a custom topic                      |
| DELETE | `/api/topics/:id`            | Delete a custom topic (cascade)         |
| POST   | `/api/patterns`              | Add a custom pattern                    |
| DELETE | `/api/patterns/:id`          | Delete a custom pattern (cascade)       |
| PUT    | `/api/questions/:id`         | Update a question                       |
| DELETE | `/api/questions/:id`         | Delete a question + revisions           |
| POST   | `/api/revisions`             | Submit a revision                       |
| PUT    | `/api/settings`              | Save revision-algorithm settings        |
| GET    | `/api/admin/users?q=`        | (Admin) List/search users with counts   |
| PATCH  | `/api/admin/users/:id`       | (Admin) Set role / enable / disable     |
| DELETE | `/api/admin/users/:userId`   | (Admin) Delete a user + data            |

Global topics/patterns cannot be deleted by regular users; only custom content
created by that user is deletable.

## Troubleshooting

- **"Could not connect to API server"** — make sure `npm run dev` is running, Postgres is up (`docker compose up -d db`), and nothing else is using port 5050.
- **Port 5000 conflict** — macOS AirPlay Receiver occupies port 5000. This app uses 5050 to avoid it.
- **`prisma migrate deploy` fails** — check `DATABASE_URL` uses SSL for managed Postgres (`?sslmode=require`).
- **Schema changes** — create a migration with `npm run db:migrate` (never `prisma db push` in production).

## License

Private project.
