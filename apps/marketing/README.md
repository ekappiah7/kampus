# Kampus product site

The site that sells Kampus itself, to schools who don't have it yet. Distinct from
`apps/web`, which is the *tenant* site each customer school gets.

Live at **https://akampuz-kampus.web.app**

## Before this is shared publicly

`lib/content.ts` carries placeholder contact details. Replace all three:

```ts
contact: {
  whatsapp: "233000000000",     // digits only, country code, no + and no spaces
  phoneDisplay: "+233 00 000 0000",
  email: "hello@example.com",
},
```

The WhatsApp number is the one that matters — it is the primary call to action and
the button is dead until it is real.

## Editing the copy

Everything the site claims lives in `lib/content.ts`, not scattered through the
components. Every claim on a sales page is a promise someone will be held to, so
there is exactly one place to correct when something ships or slips.

Capabilities carry a `status`:

| Status | Means | Say |
|---|---|---|
| `shipped` | On the live demo now | "You can see this today" |
| `building` | Real work underway | "Coming" — never imply it exists |
| `planned` | On the roadmap, no code | Say so plainly if asked |

**Keep these honest.** The whole section is built around the promise that they are,
and a prospect who catches one overstatement stops believing the rest of the page.
When a feature ships, move it to `shipped` in the same change that ships it.

## Pricing

`PRICING.tiers` has the structure — per pupil, per term, three bands by size — but
no numbers. `price: null` renders as "Talk to us". Put real figures in when they're
set, or leave it as it is: quoting on a call is a reasonable way to sell to schools
of very different sizes.

## Demo requests

The form posts to `POST /public/product-lead` on the main API and stores a
`ProductLead`. WhatsApp sits beside it with equal weight, on purpose — a proprietor
is likelier to send a message than to trust a form.

Read what's come in:

```bash
export VENDOR_KEY=$(gcloud secrets versions access latest --secret=kampus-vendor-key)
node scripts/leads.mjs
```

Reading leads is guarded by that key rather than by school login: these are
JAKBRAIN's own enquiries, and tenant auth would mean any school's administrator
could read every other school's. With no key set on the API the endpoint stays shut.

A proper inbox in a vendor console is the obvious follow-up.

## Screenshots

There are none, and that's deliberate. `components/Mockups.tsx` draws the product in
markup — sharp at any size, restyles with the design tokens, never goes stale. If a
real screenshot is ever added, put it in `public/` and note that Next's standalone
output omits that folder, so `Dockerfile` copies it explicitly.

## Deploying

```bash
gcloud builds submit --config=cloudbuild/marketing.yaml --region=us-central1 .
gcloud run deploy kampus-marketing \
  --image us-central1-docker.pkg.dev/akampuz/kampus/marketing:latest \
  --region us-central1 --allow-unauthenticated --port 8080
npx firebase-tools deploy --only hosting:marketing --project akampuz
```

The Firebase step is only needed when something in `public/` changes; the Cloud Run
deploy is what ships the page itself.

## A domain

The site is on a Firebase subdomain. A real domain — `kampus.gh`, or whatever is
free — should be attached before this is marketed:

```bash
npx firebase-tools hosting:sites:list --project akampuz
```

then add the custom domain to the `akampuz-kampus` site in the Firebase console and
point the DNS records it gives you. Nothing in the code changes.
