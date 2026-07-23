# AGENTS.md

## Cursor Cloud specific instructions

Hooshagar (هوشاگر) is a Next.js 14 (App Router, RTL/Persian) + Supabase multi-role
school-management SaaS. Frontend + API routes live in this repo; the backend is Supabase
(Auth + Postgres + RLS + Realtime + Storage). See `README.md` and `SETUP.md` for the product
overview and the full `.env.example` for the complete env var list.

### Package manager & Node
- Use **npm** (there is a `package-lock.json`; CI uses `npm ci`). The `README` mentions pnpm and
  the `Dockerfile` uses pnpm, but there is **no `pnpm-lock.yaml`** — pnpm is only for the prod
  Docker image. Stick to npm for local dev.
- Node ≥ 20 is required (`package.json` `engines`). The VM's Node 22 works fine.

### Environment / booting the dev server
- The app needs `.env.local` (gitignored). Env vars are read lazily at call time (not at import),
  so `npm run dev` boots and public pages (`/`, `/login`) render **even with placeholder Supabase
  values** — this is exactly what CI does (see the placeholder keys in `.github/workflows/ci.yml`).
- Dev server: `npm run dev` → http://localhost:3000 (script forces IPv4 DNS ordering).
- For local dev, set `USE_SUPABASE_DIRECT=true` and leave `NEXT_PUBLIC_SUPABASE_PROXY` unset so the
  app talks to Supabase directly instead of the Cloudflare (Iran) proxy.

### Standard commands (see `package.json` scripts)
- `npm run type-check` — passes clean.
- `npm run build` — production build (CI runs it with placeholder env).
- `npm test` — Jest unit tests.
- `npm run lint` — see known-issue below.

### Known pre-existing issues (NOT caused by env setup — do not "fix" as part of setup)
- **`npm run lint`** prints `Converting circular structure to JSON` from `.eslintrc.json` and does
  not actually lint. This is why `next.config.js` sets `eslint.ignoreDuringBuilds: true` and CI marks
  the lint step `continue-on-error`.
- **`npm test`**: the suite `__tests__/rate-limit-user.test.ts` fails to run under jsdom with
  `ReferenceError: TextEncoder is not defined` (undici imported transitively via
  `lib/supabase/server.ts`). The other 5 suites pass (10/10 tests). `jest.setup.js` has no
  TextEncoder polyfill.

### Local Supabase backend (auth / dashboards) — important gotcha
- A real backend is only needed to exercise login and the role dashboards. It requires **Docker**
  (not preinstalled on the VM) plus `npx supabase start` (Supabase CLI is a dev dependency).
  Ports: API `54321`, DB `54322`, Studio `54323`, Inbucket `54324`.
- **The repo's migrations do not apply cleanly to a fresh DB.** `supabase start` / `supabase db reset`
  skips all non-timestamped files (`complete_schema.sql`, `0001_initial_schema.sql`, `add_*.sql`,
  `create_*.sql`) and the numbered series (`044+`) then fails (e.g. `047_performance_optimization.sql`
  references `students.is_active` before that column exists). There is also **no `supabase/seed.sql`**.
  Provisioning a full working schema from the repo's own migrations is currently an unsolved app-level
  task — treat it as out of scope for environment setup.
- To run auth locally anyway: bring up a **clean** stack (temporarily move `supabase/migrations` aside
  so `supabase start` succeeds with an empty public schema — do not commit this), then create only the
  schema you need. The **staff login** path (`app/api/auth/login/route.ts`) just needs a `public.profiles`
  table (columns incl. `id`, `email`, `username`, `role`, `is_staff`, `must_change_password`,
  `login_attempts`, `last_login_at`) plus a matching `auth.users` user created via the Auth admin API
  (`supabase.auth.admin.createUser` with `email_confirm: true` and `user_metadata.role`). Login then
  redirects `/dashboard` → `/<role>` (e.g. `/admin`) via `middleware.ts`.
- Running local Supabase in the cloud VM needs Docker configured with the `fuse-overlayfs` storage
  driver (on Docker 29, also disable the `containerd-snapshotter` feature) and `iptables-legacy`.
