# Progress

Scaffold pass from the `design_handoff_school_platform` handoff (Aspire Royal
Academy prototype). This is a first real-implementation pass, not a finished
product — see "Open items" below before treating any surface as done.

## Done

**Monorepo & shared packages**
- pnpm workspaces + turborepo, shared `tsconfig.base.json`.
- `@kampus/design-tokens` — colors/typography/radii/shadows from the handoff README, exported as TS consts, a Tailwind preset, and consumed directly by the RN app.
- `@kampus/shared-types` — wire types shared by API + all three clients.
- `@kampus/api-client` — one typed fetch client reused by web, staff-portal, and mobile.

**Database (`packages/db`)**
- Full multi-tenant Prisma schema: schools, classes, students, parents (+ multi-guardian `ParentStudent`), staff, attendance, subjects/terms, continuous-assessment `AssessmentEntry` (weighted components), posts (+ teacher→admin approval workflow), fee line items, `StudentFeeCharge`, `Scholarship`/`ScholarshipCoverage`, `Discount`, append-only `FeeLedgerEntry`, `Payment`, `PickupNotice`, `ParentVoiceSubmission`, `Notification`, `Event`, `CafeteriaMenuItem`, `Testimonial`, `MessageThread`/`Message`.
- `seed.ts` populates the Aspire Royal Academy tenant with data shaped after the prototype's `CHILD_DATA`/`ROSTER`/`FEE_ROWS` fixtures, including one scholarship and one discount example so the ledger math is exercised.

**API (`apps/api`)**
- JWT auth, tenant + role scoped (`parent | teacher | admin | gate-staff`), separate parent/staff login endpoints.
- Parent-facing: children summary, attendance, CA-rollup grades (`lib/grading.ts` computes weighted final score + GES-style letter grade), homework, fees (with scholarship/discount notes visible per line item — never a silently changed total), fee ledger, simulated payment, pickup notice submission, parent voice submission, notifications, events.
- Staff-facing: class roster + bulk attendance marking ("Mark All Present"), CA grade entry, homework/announcement posts (admin publishes directly, teacher posts go to the approvals queue), manage staff/students, fee overview dashboard, scholarship/discount creation, message threads.
- **Pickup Desk (new feature)**: `/pickup/desk/queue`, `/desk/history`, `/desk/confirm` — the gate/admin flow the handoff flagged as the next required step, closing the loop with the parent app's pickup notice.
- Public `/schools/:subdomain` + `/cafeteria/:subdomain` endpoints power the marketing site without auth.

**Web (`apps/web`)** — Next.js App Router recreation of every section in the handoff (Hero, trust signals, About, Academics with JHS-coming-soon badge, Admissions, fee schedule table, Safety & pickup policy, staff directory, gallery placeholders, Parent Voice explainer, events preview, WhatsApp contact, footer), sticky nav with the "More" hover dropdown, tenant content fetched from the API with a fixture fallback so the site never renders blank.

**Staff Portal (`apps/staff-portal`)** — login, role-aware sidebar (teacher/admin/gate-staff), and a real page + API wiring for every nav item: Roster/Attendance, Grades Entry, Post (homework/announcements), Messages, Manage Staff & Students, Fee Overview, Pending Approvals (with the "All caught up" empty state), Parent Voice inbox, and the new **Pickup Desk**.

**Mobile (`apps/mobile`)** — Expo Router app: tab bar (Home, Homework, Fees, Calendar, More) + child switcher + quick-links grid on Home, and a real screen + API wiring for every screen in the handoff: Attendance, Grades (CA breakdown, not just final number), Homework, Fees (mobile money/card payment flow modal), Calendar, Announcements, Cafeteria, Pickup (code + status steps), Parent Voice, Notifications, More.

## Open items (do before calling any surface production-ready)

- **No test coverage anywhere.** Add API integration tests (auth, tenant isolation, CA rollup, pickup confirm) and component tests before shipping.
- **Real payment gateway.** `POST /fees/children/:id/payments` currently resolves to `SUCCESS` synchronously — wire an actual MTN MoMo/Vodafone Cash/AirtelTigo/card gateway with a webhook-driven status instead.
- **Subdomain-per-tenant routing.** Website/staff-portal/API currently take the tenant from an env var / login field, not `<school>.kampus.app` host resolution — needed before onboarding a second school.
- **File uploads.** School crest/logo, staff photos, gallery images, and report-card PDF export are unimplemented — `image-slot` placeholders remain in the website. Needs object storage (e.g. S3-compatible) + an upload endpoint.
- **Report card PDF export** (parent app "export" action) is not built.
- **Real-time notifications.** Notification rows are created server-side (pickup confirmed, etc.) but there's no push delivery (APNs/FCM) — the mobile app only polls `GET /notifications`.
- **Messaging is read-only in this pass** — `MessageThread`/`Message` models and a thread-list endpoint exist, but there's no send-message endpoint or UI yet.
- **Admin fee-overview class filter, student search/pagination, and CSV export** are not implemented — the manage/fee pages fetch full lists.
- **No CI, linting config, or Prettier config** committed yet — `pnpm lint`/`typecheck` scripts exist per-app but nothing enforces them automatically.
- **Passwords/onboarding.** Seed accounts all share the password `changeme` — there's no signup/invite flow, and no password reset.
- **Mobile app has not been run in a simulator** in this environment (no device/emulator available here) — verify with `pnpm dev` inside `apps/mobile` before treating it as working end-to-end.
