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

## The product site

`apps/marketing` sells Kampus itself, to schools that don't have it — as distinct
from `apps/web`, which is the site each customer school gets. Live at
**akampuz-kampus.web.app**.

Every claim it makes lives in `apps/marketing/lib/content.ts`, tagged `shipped`,
`building` or `planned`, and the page renders that tag beside each capability. The
honesty is the pitch: a prospect can check anything marked *Working today* on the
live demo before signing, so the ones marked *In build* are believed too. Move a
feature to `shipped` in the same change that ships it.

Contact details in that file are **placeholders** and the WhatsApp button is dead
until they're replaced. Pricing has the structure — per pupil, per term, three bands
— and no numbers; `price: null` renders as "Talk to us".

Demo requests post to `/public/product-lead` and land in `ProductLead`, which is
deliberately not school-scoped: the school enquiring isn't a tenant yet. Reading
them needs a vendor key, not a school login, so no administrator can read another
school's enquiry. `node scripts/leads.mjs` lists them; `--handled <id>` and
`--delete <id>` work the queue. A proper vendor console is the follow-up.

## People: editing and removing

Pupils, guardians and staff can all be corrected in place — a misspelt name goes
onto every report card and every fee statement, so fixing it is two clicks rather
than a support call.

Removal follows the same shape as dropping a fee: **deactivate** is the normal path
and **delete** is only for records with nothing behind them. The server counts what
depends on a person and refuses with the specific reason — "has 1 payment and 12
recorded marks on record" — rather than a flat "cannot delete".

The subtlety worth keeping: **billing is not history.** Adding a pupil bills them
for the class's fee items immediately, so a pupil has a charge and a ledger row
within a second of being created. Counting those as history would mean a name typed
twice could never be removed, which is the case the feature exists for. Unpaid
charges are derived billing and are cleared with the pupil; a single payment, mark,
attendance record or report card stops the deletion dead.

Other guards: you can't delete your own account, can't remove the school's only
administrator, can't delete a guardian still linked to a pupil, and can't unlink the
last guardian a pupil has.

## Fees: dropping a charge

A fee can be dropped three ways, and which one applies depends on how far it has
gone:

- **Never billed** — deleted outright.
- **Billed to a class** — *withdrawn*. Every pupil's charge for the current term
  is reversed and the item is archived. Earlier terms are left alone; those bills
  are closed business.
- **Billed to one pupil who shouldn't carry it** — *waived* for that pupil only.

Reversal, not deletion, is the point. The original CHARGE row stays in the ledger
and a REVERSAL is written beside it with the reason the admin typed, so "why is
this balance what it is" still has an answer next year. A parent who had already
paid ends up **in credit** rather than out of pocket, and both the portal and the
parent app say so instead of showing a bland zero.

A withdrawn item can be restored, or removed from the list for good — the latter
detaches the ledger rows rather than deleting them, and each row's note already
names the fee in words.

## Marks: the Excel round trip

Teachers here mark at home, often with no internet, and most are quicker in Excel
than in any web grid. So the portal hands them the file they would have built
themselves:

- **Download** (Grades → Mark sheet) gives an .xlsx for that class and subject,
  pupils and assessment columns already in it, each score cell validated against
  its own maximum, identity columns locked.
- **Upload** never writes on the first pass. It reports what *would* change —
  every from→to, every unmatched pupil, every out-of-range score — and waits.
  Out-of-range scores block the save entirely.
- A hidden `_kampus` sheet records the school, class, subject, term and the pupil
  id behind each row, so a file can't be applied to the wrong subject and a pupil
  renamed in the meantime still lands on the right row.
- Without that sheet — a rebuilt file, or a CSV out of Google Sheets — it falls
  back to matching on names and **says so** in the preview.
- **Class broadsheet** exports every subject against every pupil with averages
  and positions. Export only; it isn't uploaded back.

An assessment column can now be removed too, which the grid previously had no way
to undo.

## Open — say these plainly to a client

1. **Payments are simulated.** Mobile money and card record a payment; no money
   moves. The endpoint is shaped for a real gateway (create PENDING, let a
   webhook flip it to SUCCESS and write the ledger row) — the rest of the system
   needs no change. Cash-at-office is fully real.
2. **No SMS.** A large share of parents at a Ghanaian basic school won't install
   an app. Fee reminders, absence alerts and pickup codes over SMS (Hubtel or
   Arkesel) is the highest-value next build and the objection you'll hear first.
3. **Bulk import covers marks, not pupils.** Teachers can download an Excel mark
   sheet, fill it offline and upload it back (see below). The pupil register
   still has to be typed in; a school arriving with 600 names in a spreadsheet
   is the next import to build, and it reuses the same download/preview/commit
   shape.
4. **No file uploads.** Crest, staff photos and gallery images take URLs, not
   uploads. Needs object storage (Firebase Storage fits, given the footprint).
5. **No push notifications.** Notifications are created server-side and read in
   the app, but nothing is pushed to the device. FCM is the natural fit.
6. **No test suite in the repo.** The fee-drop and mark-sheet paths were both
   exercised end to end against the live API (20 and 20 assertions), but those
   scripts were throwaway. The ledger maths and the pickup-code confirm flow are
   where committed tests should start — both are the kind of bug that's invisible
   in a demo and expensive in production.
7. **Subdomain routing isn't wired.** The tenant resolves from a single school or
   an env var. Needed before onboarding school #2.
8. **No academic-year rollover.** Bulk class promotion and carrying arrears
   forward are needed before a school reaches its second September.
9. **No CI.** `cloudbuild/*.yaml` holds the build configs, but nothing runs them
   on merge.
10. **A confirmed payment can't be reversed.** Cash confirmed in error has to be
    corrected by hand. It is the same shape as a withdrawn fee — append a
    reversing ledger row — and should be built next to it.
11. **`apps/mobile` is parked** — native Expo shell, excluded from the workspace.
    See `apps/mobile/PARKED.md`.

## Build notes

- `apps/api` bundles with esbuild (`--external:@prisma/client`) and flattens the
  Prisma client out of pnpm's store; base image is `node:20-bookworm`, not
  `-slim`, because the query engine needs libssl.
- Next's standalone output omits `public/` — the Dockerfiles copy it explicitly,
  or the PWA manifest and service worker 404 and the apps stop being installable.
- Fonts are self-hosted via `next/font` rather than a runtime Google Fonts
  import: one less external round trip on slow connections.
