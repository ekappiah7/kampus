# Progress

Built from the `design_handoff_school_platform` prototypes. The platform ships
**empty** — no seed data, no demo fixtures. A first-run wizard creates the school
and head administrator; everything else is entered by the school.

See [DEMO.md](./DEMO.md) to run a client walkthrough and [DEPLOY.md](./DEPLOY.md)
for the deployment runbook.

## Live

| Surface | URL |
|---|---|
| Staff Portal (PWA) | https://akampuz-staff-portal.web.app |
| Parent App (PWA) | https://akampuz-parent.web.app |
| Website | https://akampuz-web.web.app |
| API | https://kampus-api-953883277229.us-central1.run.app |

Firebase Hosting fronts three Cloud Run services; Postgres is Neon.
`DATABASE_URL` and `JWT_SECRET` live in Secret Manager. The API runs with
`min-instances=1` so there's no cold start mid-demo.

## Done

**Auth & tenancy**
- Setup wizard (school + head admin), closed once a school exists.
- Staff sign in with email + password; parents with phone + password.
- Admin-issued **single-use access codes** for staff and guardians — the holder
  redeems one to set their own password. Reissuable; never recoverable after use.
- Tenant resolves automatically when only one school exists, by subdomain otherwise.
- Every query is scoped by `schoolId`; role gates on `parent | teacher | admin | gate-staff`.

**Website** — full prototype fidelity: gradient hero with floating accreditation
card, trust badges, mission/vision, programme cards with the JHS "coming soon"
ribbon, numbered admission steps beside a **working Request Information form**,
per-class fee table, events, dark safety section, staff directory, bento
gallery, **working public Parent Voice form**, full contact block, 4-column
footer, WhatsApp FAB. Every word is tenant content edited from the portal.

**Parent App (PWA)** — greeting card, child-switcher sheet, quick-links grid,
attendance, grades with the **CA breakdown behind each grade**, homework with
mark-done, fees with itemised scholarship/discount deductions and the full
**MoMo / card / cash-at-office** flow, calendar, announcements with category
tags, cafeteria, pickup (code + time + status steps + approved guardians),
Parent Voice, notifications, password change. Installable, offline app shell.

**Staff Portal (PWA)** — dashboard with a setup checklist and action queues;
people management (pupils, guardians, staff, access codes, monitored flag);
classes/subjects/terms; fees (items, billing, cash confirmation, manual
payments, discounts, scholarships); attendance register; **spreadsheet mark
book** with weight validation and bulk save; report cards; posts with the
teacher→admin approval workflow; approvals queue; **Pickup Desk**; Parent Voice
inbox with replies; two-pane messaging that sends; admissions inbox; website
content editor.

**Report cards** — GES-format terminal report: CA breakdown per subject
(class score / exam score / total / 1–9 grade), weighted average, live class
position, attendance summary, conduct/attitude/interest, teacher and head
remarks, signature lines. Prints to PDF from the browser. Published per class;
invisible to parents until published.

**Money** — `apps/api/src/lib/fees.ts` is the single source of truth. Scholarships
subsidise named line items; discounts are fixed or percent, per-item or spread
proportionally across the term bill, one-off or recurring. Subsidies can never
push a line below zero. Every charge, payment, scholarship and discount is an
append-only ledger row, so "why is this balance what it is" always has an answer.

**Audit log** — sensitive admin actions (grades, discounts, payments, access
resets, publishing) are recorded with actor and timestamp.

## Verified

The full demo path was exercised end to end against a real Postgres before
deploying: setup → term/class/subjects → teacher + code redemption → pupil +
guardian + code → billing → scholarship and discount maths → cash reference and
confirmation → attendance → weighted marks → homework approval gate → pickup code
confirmed at the gate → report card published → website lead and Parent Voice
landing in the admin inbox. All four packages typecheck; all three apps build.

## Open — say these plainly to a client

1. **Payments are simulated.** Mobile money and card record a payment; no money
   moves. The endpoint is shaped for a real gateway (create PENDING, let a
   webhook flip it to SUCCESS and write the ledger row) — the rest of the system
   needs no change. Cash-at-office is fully real.
2. **No SMS.** A large share of parents at a Ghanaian basic school won't install
   an app. Fee reminders, absence alerts and pickup codes over SMS (Hubtel or
   Arkesel) is the highest-value next build and the objection you'll hear first.
3. **No bulk import.** Every school has a pupil spreadsheet; typing 600 of them
   in by hand is an adoption blocker. CSV import is phase 2.
4. **No file uploads.** Crest, staff photos and gallery images take URLs, not
   uploads. Needs object storage (Firebase Storage fits, given the footprint).
5. **No push notifications.** Notifications are created server-side and read in
   the app, but nothing is pushed to the device. FCM is the natural fit.
6. **No tests.** Start with the fee ledger maths and the pickup-code confirm
   flow — both are the kind of bug that's invisible in a demo and expensive in
   production.
7. **Subdomain routing isn't wired.** The tenant resolves from a single school or
   an env var. Needed before onboarding school #2.
8. **No academic-year rollover.** Bulk class promotion and carrying arrears
   forward are needed before a school reaches its second September.
9. **No CI.** `cloudbuild/*.yaml` holds the build configs, but nothing runs them
   on merge.
10. **`apps/mobile` is parked** — native Expo shell, excluded from the workspace.
    See `apps/mobile/PARKED.md`.

## Build notes

- `apps/api` bundles with esbuild (`--external:@prisma/client`) and flattens the
  Prisma client out of pnpm's store; base image is `node:20-bookworm`, not
  `-slim`, because the query engine needs libssl.
- Next's standalone output omits `public/` — the Dockerfiles copy it explicitly,
  or the PWA manifest and service worker 404 and the apps stop being installable.
- Fonts are self-hosted via `next/font` rather than a runtime Google Fonts
  import: one less external round trip on slow connections.
