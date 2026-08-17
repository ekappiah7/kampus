# Deploying Kampus for a client demo (Firebase Hosting + Cloud Run, Blaze plan)

## Live demo (deployed 2026-08-17, project `akampuz`)

| Surface | URL |
|---|---|
| Marketing website | https://akampuz-web.web.app |
| Staff portal | https://akampuz-staff-portal.web.app |
| API (direct, used by both apps) | https://kampus-api-953883277229.us-central1.run.app |

Demo logins (password `changeme` for everyone — rotate before this goes near a
real client's data):
- Parent app / would-be mobile app: phone `024 883 4000`
- Staff portal, teacher: `abigail.bentil@aspireroyal.edu.gh`
- Staff portal, admin: `collins.owusu@aspireroyal.edu.gh`

Database is Neon Postgres (project "Kampus", `neondb`), migrated and seeded with
the Aspire Royal Academy reference tenant. `JWT_SECRET` and `DATABASE_URL` are
stored in Secret Manager (`kampus-jwt-secret`, `kampus-database-url`) and injected
into the `kampus-api` Cloud Run service — not committed anywhere.

The parent mobile app itself is not deployed anywhere yet (Expo apps aren't
"hosted" the way a website is) — see step 5 below for a browser-based demo build,
or `eas build` for a real installable app.

To redeploy after a code change: rebuild+push the relevant image with
`gcloud builds submit --config=... .` (see steps 2–3 below for the exact
commands with `--build-arg`s), then `gcloud run deploy <service> --image ...`
again — Cloud Run keeps serving the old revision with zero downtime until the
new one is healthy.

---


Firebase's Spark (free, no-billing) plan can't run a server — no SSR, no long-lived
API. This setup keeps the exact stack from the repo (Postgres/Prisma/Express/Next.js,
no rewrite) and hosts it through **Firebase Hosting on the Blaze plan**, which
requires a billing card on file but costs **$0 at demo-level traffic**: Cloud Run's
free tier is 2 million requests/month, and Firebase Hosting's free tier covers the
bandwidth a demo will use.

Three pieces run on Cloud Run (containers, from the Dockerfiles already in this
repo); Firebase Hosting sits in front of them for clean URLs. Postgres lives outside
Firebase entirely, on Neon's free tier, since Firebase has no relational database.

## 0. Prerequisites (one-time, on your machine)

1. A Google account → create a project at https://console.firebase.google.com,
   then **Upgrade to Blaze** (Project settings → Usage and billing). You'll be asked
   for a card; nothing is charged unless you exceed the free tier.
2. Install CLIs:
   ```bash
   npm install -g firebase-tools
   # gcloud: https://cloud.google.com/sdk/docs/install
   ```
3. Authenticate:
   ```bash
   firebase login
   gcloud auth login
   gcloud config set project YOUR_FIREBASE_PROJECT_ID
   gcloud services enable run.googleapis.com artifactregistry.googleapis.com
   ```
4. A free Postgres database: sign up at https://neon.tech, create a project, copy
   the connection string (`postgresql://...`). Put it somewhere safe — it's `DATABASE_URL`
   below.
5. Replace `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID` in `.firebaserc` with your real
   project ID (both places).

## 1. Provision the database

```bash
cd packages/db
echo 'DATABASE_URL="<your Neon connection string>"' > .env
pnpm generate
pnpm exec prisma migrate deploy
pnpm seed          # loads the Aspire Royal Academy demo data
```

## 2. Deploy the API to Cloud Run

```bash
cd /path/to/kampus   # repo root — the Dockerfile needs the whole workspace as build context
gcloud artifacts repositories create kampus --repository-format=docker --location=us-central1 2>/dev/null || true

docker build -f apps/api/Dockerfile -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/kampus/api .
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/kampus/api

gcloud run deploy kampus-api \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/kampus/api \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "JWT_SECRET=$(openssl rand -hex 32)" \
  --set-secrets "DATABASE_URL=kampus-database-url:latest"
```

`--set-secrets` expects the connection string to already be in Secret Manager —
simplest one-time setup:
```bash
printf '%s' "<your Neon connection string>" | gcloud secrets create kampus-database-url --data-file=-
```
(For a quick first demo you can substitute `--set-env-vars "DATABASE_URL=...,JWT_SECRET=..."`
instead of Secret Manager — just don't leave it that way past the demo.)

Note the service URL Cloud Run prints, e.g. `https://kampus-api-xxxxx-uc.a.run.app`.
That's `NEXT_PUBLIC_API_URL` for the next step.

## 3. Deploy the website and staff portal to Cloud Run

```bash
API_URL="https://kampus-api-xxxxx-uc.a.run.app"   # from step 2

for app in web staff-portal; do
  docker build -f apps/$app/Dockerfile \
    --build-arg NEXT_PUBLIC_API_URL=$API_URL \
    --build-arg NEXT_PUBLIC_SCHOOL_SUBDOMAIN=aspire-royal \
    -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/kampus/$app .
  docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/kampus/$app
  gcloud run deploy kampus-$app \
    --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/kampus/$app \
    --region us-central1 \
    --allow-unauthenticated
done
```

`NEXT_PUBLIC_*` vars are baked in at build time, which is why the API must already
be deployed before this step.

## 4. Front them with Firebase Hosting

```bash
firebase hosting:sites:create kampus-web
firebase hosting:sites:create kampus-staff-portal
firebase hosting:sites:create kampus-mobile-web
firebase target:apply hosting web kampus-web
firebase target:apply hosting staff-portal kampus-staff-portal
firebase target:apply hosting mobile-web kampus-mobile-web

firebase deploy --only hosting:web,hosting:staff-portal
```

Your demo URLs: `https://kampus-web.web.app` and `https://kampus-staff-portal.web.app`.

## 5. Parent app — browser demo build

The Expo app isn't installable from a link the way a website is; for a client demo,
export it to a static web build and host that as the third site:

```bash
cd apps/mobile
EXPO_PUBLIC_API_URL=$API_URL npx expo export --platform web --output-dir dist
cd ../..
firebase deploy --only hosting:mobile-web
```
(`app.json`'s `extra.apiUrl` is the fallback if you don't override via env — update it
to the deployed API URL directly if that's simpler for you.)

For anything past a browser demo — letting your client actually install it on a
phone — use `eas build` (see "Scaling up" below) instead of the web export.

## 6. Give the client a login

Seeded demo accounts (password `changeme` for everyone):
- Parent app: phone `024 883 4000`
- Staff portal (teacher): `abigail.bentil@aspireroyal.edu.gh`
- Staff portal (admin): `collins.owusu@aspireroyal.edu.gh`

Change these before this goes anywhere near a real client's data.

---

## Scaling up — recommendations once the demo lands

**Immediate hardening (before a second real demo, not just "someday")**
- Rotate `JWT_SECRET` and all seeded passwords out of the demo defaults; move both
  into Secret Manager if not already there.
- Add `min-instances=1` on the API's Cloud Run service (`gcloud run services update kampus-api --min-instances=1`)
  — Cloud Run scales to zero by default, so the first request after idle time eats
  a multi-second cold start + a cold Postgres connection. Fine for a demo you're
  driving live; bad for someone waiting on it unattended.
- Add a `firebase.json` rewrite header block (`Cache-Control`) is not needed yet,
  but do add `gcloud run services update --concurrency` tuning once you see real
  traffic shape.

**Multi-tenancy → the thing the schema was built for**
- Wire actual subdomain routing (`<school>.kampus.app` → resolve tenant by host,
  not by `NEXT_PUBLIC_SCHOOL_SUBDOMAIN`/login field) before onboarding school #2.
  Firebase Hosting supports custom domains per site; Cloud Run + a small middleware
  resolving `Host` → `schoolId` is the missing piece.
- Per-tenant Postgres connection pooling matters once you're not on Neon's free
  tier alone — look at PgBouncer (Neon includes pooled connections; Cloud SQL needs
  its own).

**Database**
- Neon's free tier is fine for a demo and even early pilot schools, but it sleeps
  idle branches and caps storage/compute. When a real school's attendance/fee data
  is on the line, move to Neon's paid tier or Cloud SQL for Postgres (same Prisma
  schema, just change `DATABASE_URL` — no code change).
- Turn on the fee ledger's implied recommendation from the design handoff: nightly
  automated backups (Neon/Cloud SQL both do this, just confirm retention).

**The genuinely-open engineering items from PROGRESS.md, in rough priority order**
1. Real Mobile Money/card payment gateway — the payment flow currently resolves
   to `SUCCESS` synchronously; this is the one item a real client will notice fastest.
2. Push notifications via **Firebase Cloud Messaging** — since you're already inside
   Firebase, FCM is the natural fit for the parent app's pickup/grade/fee alerts
   instead of the current poll-only `GET /notifications`.
3. File uploads (school crest, staff photos, gallery, report-card PDF export) via
   **Firebase Storage** or GCS — also a natural fit given the Firebase footprint.
4. Test coverage — there is currently none. Start with the fee ledger math and the
   pickup-code confirm flow; both are the kind of bug that's invisible in a demo
   and expensive in production.
5. CI/CD — a GitHub Action that builds+pushes the three images and redeploys on
   merge to `main`, so "scale up" doesn't mean hand-running the steps in this file
   forever.

**Mobile distribution**
- For anything beyond a browser demo: `eas build` (Expo Application Services) for
  real iOS/Android builds, then TestFlight / Play Store internal testing before a
  public store listing. This is a different pipeline from the web export above —
  budget for Apple Developer ($99/yr) and Google Play ($25 one-time) accounts when
  you're ready for that step.
