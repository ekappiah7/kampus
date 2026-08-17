# Kampus

Multi-tenant school digital platform — marketing website, parent app, and staff
portal — productized by JAKBRAIN Consult. This repo recreates the
`design_handoff_school_platform` prototypes (Aspire Royal Academy reference
client) as real, multi-tenant applications backed by a shared Postgres
database and API.

See [PROGRESS.md](./PROGRESS.md) for what's implemented vs. still open.

## Structure (pnpm + turborepo monorepo)

```
apps/
  api/            Express + Prisma REST API — the single backend for all clients
  web/             Next.js marketing website
  staff-portal/     Next.js staff/admin web app (teacher + admin + gate-staff roles)
  mobile/            Expo (React Native) parent app
packages/
  db/                 Prisma schema, client, seed script
  design-tokens/       Shared colors/typography/radii — Tailwind preset + RN theme
  shared-types/         Wire types shared between the API and its clients
  api-client/            Typed fetch client used by web, staff-portal, and mobile
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
pnpm db:seed        # seeds the Aspire Royal Academy reference tenant

cp apps/web/.env.example apps/web/.env.local
cp apps/staff-portal/.env.example apps/staff-portal/.env.local

pnpm dev             # runs all apps via turborepo (api :4000, web :3000, staff-portal :3001)
```

Mobile app: `cd apps/mobile && pnpm dev` (Expo Go / simulator). Point
`app.json`'s `extra.apiUrl` at your machine's LAN IP when testing on a
physical device, since `localhost` won't resolve to your dev machine from a
phone.

Seeded login credentials (password `changeme` for all staff/parent accounts):
- Parent: phone `024 883 4000`
- Teacher: `abigail.bentil@aspireroyal.edu.gh`
- Admin: `collins.owusu@aspireroyal.edu.gh`

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
