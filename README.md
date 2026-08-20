# Kampus

Multi-tenant school digital platform — marketing website, parent app, and staff
portal — productized by JAKBRAIN Consult. This repo recreates the
`design_handoff_school_platform` prototypes (Aspire Royal Academy reference
client) as real, multi-tenant applications backed by a shared Postgres
database and API.

**Live:** [Staff Portal](https://akampuz-staff-portal.web.app) ·
[Parent App](https://akampuz-parent.web.app) ·
[Website](https://akampuz-web.web.app)

The platform ships empty — a first-run wizard creates the school and its head
administrator, and everything after that is entered by the school itself.

- [DEMO.md](./DEMO.md) — running a client walkthrough
- [PROGRESS.md](./PROGRESS.md) — what's built, and what isn't
- [DEPLOY.md](./DEPLOY.md) — deployment runbook

## Structure (pnpm + turborepo monorepo)

```
apps/
  api/            Express + Prisma REST API — the single backend for all clients
  web/             Next.js marketing website
  staff-portal/     Next.js staff/admin PWA (teacher + admin + gate-staff roles)
  parent-app/        Next.js parent PWA (installable, offline app shell)
  mobile/             parked Expo shell — see apps/mobile/PARKED.md
packages/
  db/                 Prisma schema + client (no seed data by design)
  design-tokens/       Shared colors/typography/radii — Tailwind preset + RN theme
  shared-types/         Wire types shared between the API and its clients
  api-client/            Typed fetch client shared by all three front-ends
```

## Getting started

```bash
corepack enable
pnpm install

# Postgres (local dev)
docker compose up -d
cp packages/db/.env.example packages/db/.env
cp apps/api/.env.example apps/api/.env
pnpm db:generate
pnpm db:migrate
# No seed step — the platform starts empty by design.

cp apps/web/.env.example apps/web/.env.local
cp apps/staff-portal/.env.example apps/staff-portal/.env.local
cp apps/staff-portal/.env.example apps/parent-app/.env.local

# api :4000 · web :3000 · staff-portal :3001 · parent-app :3002
pnpm dev
```

Then open the staff portal (`:3001`) and complete the setup wizard — it creates
your school and signs you in as its head administrator. There are no default
credentials, because there is no default data.

## Multi-tenancy

Every core table carries a `schoolId` foreign key (see
`packages/db/prisma/schema.prisma`). The website and API resolve the current
tenant from `NEXT_PUBLIC_SCHOOL_SUBDOMAIN` / a `schoolSubdomain` login field
today; wiring real subdomain-per-school routing (`<school>.kampus.app`) is
listed as an open item in PROGRESS.md.

## Design source

`design_handoff_school_platform/` (not committed here — it was a design
handoff bundle) is the source of truth for copy, layout, and the design
tokens in `packages/design-tokens`. Fidelity notes and the "New Features to
Design & Build" brief (Pickup Desk, continuous assessment, scholarships,
discounts, fee ledger) are what shaped `packages/db/prisma/schema.prisma`
and the corresponding API routes.
