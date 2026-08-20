/**
 * No demo data by design.
 *
 * The platform ships empty: the first school and its head-administrator account are
 * created through the setup wizard (`POST /setup` → the staff portal's /setup page),
 * and every teacher, parent, pupil, mark and fee is entered by the school itself.
 * That way a live walkthrough shows the real workflow rather than pre-baked fixtures.
 *
 * This file stays as a deliberate placeholder so `prisma db seed` is a safe no-op
 * instead of failing or silently reintroducing fixtures.
 */
async function main() {
  console.log("Nothing to seed — Kampus starts empty. Run the setup wizard to create your school.");
}

main();
