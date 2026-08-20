# Deploying Kampus for a client demo (Firebase Hosting + Cloud Run, Blaze plan)

## Live (project `akampuz`)

| Surface | URL |
|---|---|
| Staff Portal (PWA) | https://akampuz-staff-portal.web.app |
| Parent App (PWA) | https://akampuz-parent.web.app |
| Website | https://akampuz-web.web.app |
| API | https://kampus-api-953883277229.us-central1.run.app |

**No default credentials.** The system starts empty; the staff portal opens on a
setup wizard that creates the school and its head administrator. See
[DEMO.md](./DEMO.md) for the walkthrough.

Database is Neon Postgres. `DATABASE_URL` and `JWT_SECRET` are in Secret Manager
(`kampus-database-url`, `kampus-jwt-secret`) and injected into Cloud Run — never
committed. The API runs `--min-instances=1` so there's no cold start mid-demo.

### Redeploying

Build configs live in `cloudbuild/`. From the repo root:

```bash
# migrations (destructive: resets the database to empty)
gcloud builds submit --config=cloudbuild/migrate.yaml --region=us-central1 .

# a service
gcloud builds submit --config=cloudbuild/api.yaml --region=us-central1 .
gcloud run deploy kampus-api \
  --image us-central1-docker.pkg.dev/akampuz/kampus/api:latest \
  --region us-central1 --allow-unauthenticated --port 8080 \
  --set-secrets "DATABASE_URL=kampus-database-url:latest,JWT_SECRET=kampus-jwt-secret:latest" \
  --min-instances 1

# same shape for web / staff-portal / parent-app, then:
firebase deploy --only hosting --project akampuz
```

`NEXT_PUBLIC_*` values are baked in at build time, so the API must be deployed
before the front-ends if its URL changes.

## How it fits together

Firebase's Spark (free, no-billing) plan can't run a server, so this uses the
**Blaze** plan: Firebase Hosting fronts three Cloud Run services built from the
Dockerfiles in this repo. At demo traffic it costs nothing — Cloud Run's free
tier is 2M requests/month — though `--min-instances=1` on the API does incur a
small always-on charge, which is the price of never showing a client a cold
start.

Postgres lives outside Firebase on Neon, because Firebase has no relational
database and the fee ledger genuinely needs one.

```
  akampuz-web.web.app ───────────► Cloud Run: kampus-web
  akampuz-staff-portal.web.app ──► Cloud Run: kampus-staff-portal
  akampuz-parent.web.app ────────► Cloud Run: kampus-parent-app
                                          │
                                          ▼
                                   Cloud Run: kampus-api ──► Neon Postgres
```

## Setting up a fresh environment

1. Create a Firebase project and upgrade it to **Blaze**.
2. `npm i -g firebase-tools`, install the gcloud SDK, then `firebase login` and
   `gcloud auth login`.
3. Enable services:
   ```bash
   gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
     cloudbuild.googleapis.com secretmanager.googleapis.com
   gcloud artifacts repositories create kampus \
     --repository-format=docker --location=us-central1
   ```
4. Create a Postgres database at neon.tech and store the secrets:
   ```bash
   printf '%s' "<neon connection string>" | \
     gcloud secrets create kampus-database-url --data-file=-
   openssl rand -hex 32 | tr -d '\n' | \
     gcloud secrets create kampus-jwt-secret --data-file=-
   ```
   Grant the Cloud Build/Run service account `roles/secretmanager.secretAccessor`
   on both.
5. Update `.firebaserc` with the project id, create the three Hosting sites, and
   apply the targets (`web`, `staff-portal`, `parent-app`).
6. Run the migration build, then the three service builds and deploys from the
   "Redeploying" section above.

Note: the sandbox this was built in has HTTPS-only egress, so migrations run
through Cloud Build rather than connecting to Postgres directly. If your machine
can reach Neon on 5432 you can just run `prisma migrate deploy` locally.

---

## Scaling up after the demo

**Already done:** secrets in Secret Manager, `min-instances=1` on the API, no
default credentials anywhere, self-hosted fonts, PWA installability.

**Next, in the order a client will notice**

1. **Real payment gateway.** Mobile money and card currently record a payment
   without moving money. `POST /fees/children/:id/payments` should create the
   payment as `PENDING`, return a checkout handle, and let the gateway's webhook
   flip it to `SUCCESS` and write the ledger row — everything downstream already
   reads from the ledger and needs no change. Hubtel and Paystack both cover
   MTN/Vodafone/AirtelTigo plus cards in Ghana.
2. **SMS.** The biggest adoption gap: parents without smartphones get nothing
   today. Fee reminders, absence alerts and pickup codes over Hubtel or Arkesel
   would let the school promise coverage for *every* parent.
3. **Bulk import.** CSV/Excel import for pupils and guardians. Without it,
   onboarding a 600-pupil school means 600 forms.
4. **File uploads** via Firebase Storage — crest, staff photos, gallery. The
   website shows dashed placeholders wherever imagery is missing.
5. **Push notifications** via FCM, replacing the current read-on-open model.
6. **Tests.** Start with `lib/fees.ts` (scholarship + discount + payment maths)
   and the pickup-confirm flow.
7. **CI.** A GitHub Action running the `cloudbuild/` configs on merge to `main`.
8. **Subdomain-per-tenant routing** before school #2 — resolve `Host` → `schoolId`
   rather than reading an env var. Firebase Hosting supports a custom domain per
   site.
9. **Academic-year rollover** — bulk promotion, archiving leavers, carrying
   arrears forward. Needed before a school's second September.

**Database.** Neon's free tier sleeps idle branches and caps compute — fine for
demos and a pilot, but move to a paid tier or Cloud SQL once a real school's
attendance and fee records depend on it. Same Prisma schema; only `DATABASE_URL`
changes. Confirm backup retention either way.

**Native apps.** `apps/mobile` holds a parked Expo shell (see its `PARKED.md`).
When store presence is worth it, `eas build` → TestFlight / Play internal
testing; budget for the Apple ($99/yr) and Google Play ($25) accounts. The API,
shared types and design tokens all carry over unchanged.
