/**
 * Reads the demo requests that came in through the Kampus product site.
 *
 * These are vendor sales enquiries, not tenant data, so they sit behind a vendor
 * key rather than a school login — no school administrator should ever be able to
 * read another school's enquiry.
 *
 * Usage:
 *   VENDOR_KEY=... node scripts/leads.mjs [--api <url>] [--json]
 *   VENDOR_KEY=... node scripts/leads.mjs --handled <id>    # mark one dealt with
 *   VENDOR_KEY=... node scripts/leads.mjs --delete <id>     # spam or test entries
 *
 * Get the key with:
 *   gcloud secrets versions access latest --secret=kampus-vendor-key
 */

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};

const API = flag("api", "https://kampus-api-953883277229.us-central1.run.app");
const KEY = process.env.VENDOR_KEY;

if (!KEY) {
  console.error("Set VENDOR_KEY first:\n  export VENDOR_KEY=$(gcloud secrets versions access latest --secret=kampus-vendor-key)");
  process.exit(1);
}

const headers = { "x-vendor-key": KEY, "Content-Type": "application/json" };

const handledId = flag("handled");
const deleteId = flag("delete");

if (handledId || deleteId) {
  const id = handledId ?? deleteId;
  const r = await fetch(`${API}/public/product-leads/${id}`, {
    method: handledId ? "PATCH" : "DELETE",
    headers,
    body: handledId ? JSON.stringify({ handled: true }) : undefined,
  });
  if (!r.ok) {
    console.error(`Failed — ${r.status} ${await r.text()}`);
    process.exit(1);
  }
  console.log(handledId ? "Marked handled." : "Deleted.");
  process.exit(0);
}

const res = await fetch(`${API}/public/product-leads`, { headers });
if (!res.ok) {
  console.error(`Could not read leads — ${res.status} ${await res.text()}`);
  process.exit(1);
}

const leads = await res.json();

if (args.includes("--json")) {
  console.log(JSON.stringify(leads, null, 2));
  process.exit(0);
}

if (!leads.length) {
  console.log("No demo requests yet.");
  process.exit(0);
}

const waiting = leads.filter((l) => !l.handled).length;
console.log(`${leads.length} demo request(s), ${waiting} still to contact (marked →):\n`);
for (const l of leads) {
  const when = new Date(l.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  console.log(`${l.handled ? "  " : "→ "}${l.schoolName}`);
  console.log(`   ${l.name} · ${l.role}`);
  console.log(`   ${l.phone}${l.email ? ` · ${l.email}` : ""}${l.size ? ` · ${l.size} pupils` : ""}`);
  if (l.message) console.log(`   "${l.message.replace(/\s+/g, " ").trim()}"`);
  console.log(`   ${when}   id ${l.id}\n`);
}
