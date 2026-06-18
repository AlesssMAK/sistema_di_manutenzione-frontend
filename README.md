# sistema_di_manutenzione — frontend

Next.js 16 frontend for the MMS (maintenance management system).
Each role gets its own dashboard plus a shared messaging / report
flow; everything is mobile-first.

The API lives in a separate repo:
[sistema_di_manutenzione-backend](https://github.com/AlesssMAK/sistema_di_manutenzione-backend).

## Stack

- **Next.js 16** (App Router, server-side proxy routes under
  `app/api/*` that forward to the Express backend with the user's
  session cookie)
- **TypeScript** + **React 19**
- **State**:
  - [TanStack Query](https://tanstack.com/query) — server cache,
    cache-aware invalidation on socket events
  - [Zustand](https://zustand.docs.pmnd.rs) — small client stores
    (auth, page meta, draft report persisted to localStorage)
- **Forms** — React Hook Form + Yup
- **i18n** — `next-intl` with four locales: `it` (primary), `en`,
  `es`, `pl`
- **Dates** — `date-fns` with `locale: it` for display
- **Realtime** — `socket.io-client`, scoped per fault subscription
- **UI** — CSS Modules, mobile-first (768 / 1440 breakpoint
  heuristic), no UI library

## Pages by role

| Path | Role | What's there |
|---|---|---|
| `/login` | all | Email / fullName + password (operators sign in with their personalCode instead) |
| `/report-fault` | operator + maintenanceWorker + safety | New fault form (with localStorage draft autosave) |
| `/maintenance-worker` | maintenanceWorker | Calendar + active / overdue / completed tabs + scope filter (mine / pool / all) |
| `/manager` | manager | Active / new / planned / completed tabs with live counters; planning + reassign + add-maintainers |
| `/safety` | safety | Safety-typed faults list + detail with HSE notes |
| `/operator` | operator | Personal dashboard: own faults (7d/30d/3m/all) + messages mirror |
| `/messages` | all | Direct and role-broadcast tabs, reply support |
| `/reports-and-communications` | manager + admin | Broadcasts + recent faults (30d) |
| `/admin` | admin | Users, plants, plant-parts CRUD |

## Getting started

```bash
git clone https://github.com/AlesssMAK/sistema_di_manutenzione-frontend
cd sistema_di_manutenzione-frontend
npm install
cp .env.example .env.local  # set NEXT_PUBLIC_BACKEND_API_URL if not localhost:3040
npm run dev                 # http://localhost:3000
```

The frontend always talks to the backend through `app/api/*`
proxy routes, never directly. That keeps the session cookie
HttpOnly on the Next.js side.

### Env vars

| Var | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Frontend's own origin (used for absolute URLs in metadata, OG tags, etc.) |
| `NEXT_PUBLIC_BACKEND_API_URL` | `http://localhost:3040` | Express backend base URL the proxy routes forward to |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (default port 3000) |
| `npm run build` | Production build |
| `npm start` | Production server on built output |
| `npm run lint` | ESLint with next-config |

## Layout

```
app/
  (private routes)/       Authenticated layouts per role
  api/                    Next.js route handlers — proxy to backend
  login/                  Public auth pages
components/
  Admin/                  Admin CRUD: users, plants, parts
  Header/                 App header + role-aware modal menu
  MaintenanceWorker/      Calendar, day-slot grid, scope filter
  Manager/                Fault cards, tab counters
  Operator/               Personal dashboard
  Messages/               Direct + broadcast UI
  Reports/                Recent-faults list
  forms/                  Shared forms (ReportForm, PlanFaultForm, …)
  UI/                     Buttons, modals, inputs, dropdowns, loader
lib/
  api/                    Typed axios calls grouped by feature
  store/                  Zustand stores
  validation/             Yup schemas
messages/                 i18n bundles (it / en / es / pl)
types/                    Shared TS types
```
