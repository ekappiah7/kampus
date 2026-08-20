# Running the live demo

Three links. Nothing is pre-filled — you and the administrator build the school
together, in the room, and every screen fills with their own data as you go.

| Surface | URL | Who it's for |
|---|---|---|
| **Staff Portal** | https://akampuz-staff-portal.web.app | Head teacher, teachers, gate staff |
| **Parent App** | https://akampuz-parent.web.app | Parents (installable) |
| **Website** | https://akampuz-web.web.app | The public |

Have the portal open on your laptop and the Parent App on a phone. The moment
that lands hardest is when something you type on the laptop appears on the phone
a second later.

## Before they arrive

- **Install both apps to a home screen.** Open the Parent App on your phone →
  browser menu → *Add to Home Screen*. It then opens fullscreen with its own
  icon and no address bar, which is what makes people stop calling it "a
  website". Do the same on the laptop for the portal.
- **Check the state.** The database starts empty. If you've rehearsed and want a
  clean slate again, see "Resetting" below.
- **Have a second device ready** if you can — laptop for the portal, phone for
  the parent side, so you're not switching tabs in front of them.

## The run-through (about 15 minutes)

**1. Set the school up — hand them the keyboard.**
Go to the Staff Portal. It opens on the setup wizard because no school exists
yet. Let the head teacher type their *own* school name, colour, phone, GES
number. When they hit "Create school & sign in" they land on their dashboard
as the head administrator. It's their school on screen within two minutes, not
a mock-up of someone else's.

**2. Open a term, add a class.**
*Classes & Terms* → open a term (Term 1, their academic year) → add a class, or
use "Standard Crèche → Primary 6" for the whole ladder in one click. Add a few
subjects.

**3. Add a teacher — show the access code.**
*Staff & Pupils* → **+ Staff**. On save the system issues a one-time code like
`K7M2-QPX9`. Point out what this solves: no shared passwords, no admin knowing
staff passwords, and the code dies the moment it's used. Hand the code to
whoever is playing the teacher and let them redeem it at
`/redeem` — they choose their own password and land in their own portal.

**4. Add a pupil and a guardian in one step.**
Still in *Staff & Pupils* → **+ Pupil**. Fill in the child, tick "link a
guardian", enter the parent's name and phone. Save, and a parent access code
appears. Redeem it on the phone at the Parent App's *Use your access code*.
The parent is now signed in and seeing their child.

**5. Money — the part administrators care about most.**
*Fees* → add "Tuition" and "Feeding fee" → **Bill to class**. Refresh the phone:
the balance is there. Now apply a **sibling discount** and a **scholarship** on
the pupil's row. Refresh the phone again — the parent sees the original amount
struck through, the new total, and a labelled line for *why* it changed. Say
the line out loud: parents never see a total change without being told why.

Then tap **Pay Now → Cash at School Office** on the phone. It issues a
reference. On the laptop, *Fees* shows it waiting under "Cash payments to
confirm". Confirm it, refresh the phone, balance drops. That's the flow most
Ghanaian basic schools actually run on, and it's the one most software ignores.

**6. Teaching — attendance and the mark book.**
Sign in as the teacher (or switch to their browser). *Attendance* → mark the
register; "Mark all present" does the class in one tap, and any absence
notifies the guardians. *Enter Grades* → add two assessments (say Classwork 40%,
End-of-term exam 60% — it won't let the weights exceed 100%) and type marks
straight into the grid like a mark book. The final grade computes live.

Refresh the phone → *Grades* → tap a subject. The parent sees the breakdown
behind the grade, not just a letter.

**7. Approval workflow.**
As the teacher, post homework. On the phone it's *not there*. Back on the admin
account, *Approvals* → approve. Now it's on the phone. Nothing reaches parents
without the head teacher's sign-off.

**8. Pickup — the safety story.**
On the phone: *Pickup* → "Auntie Akosua", Family member, 2:30pm → send. A code
appears. On the laptop, *Pickup Desk* shows it in the queue within ten seconds.
Type or click the code → confirmed → the parent's phone shows the child
released. No child leaves without a verified code.

**9. Report cards — the closer for a head teacher.**
*Report Cards* → **Remarks** on a pupil → conduct, attitude, teacher's remark →
save. **Print** opens a GES-format terminal report with the CA breakdown, class
position, attendance and signature lines — ready for the browser's *Save as
PDF*. Ask how long 600 of those take by hand each term.

Then **Publish to parents**. Only now can the parent open it on the phone.

**10. The website is theirs too.**
*Website* in the portal → fill in the hero, about, programmes, safety policies.
Open the public site and show their own words on it. Then, on the public site,
submit a **Request Information** enquiry — it lands in the portal's *Admissions*
inbox. Their website stops being a brochure and becomes a way to get pupils.

## Resetting between demos

The database is Neon Postgres. To wipe it back to empty:

```bash
gcloud builds submit --config=cloudbuild/migrate.yaml --region=us-central1 .
```

That runs `prisma migrate reset` against the live database — it drops
everything. Only run it when you *want* an empty system.

## If something goes wrong

- **A screen won't load** — the API may be waking. It's set to keep one instance
  warm, but if you've left it idle for days, load the portal once before they
  walk in.
- **"That access code is not valid"** — codes are single-use. Reissue from
  *Staff & Pupils* → *Reset access*.
- **The phone shows old data** — pull to refresh, or navigate away and back. The
  apps don't poll every screen; that's deliberate for data cost.

## What to say about what's not built yet

Be straight about these — a head teacher will respect it, and each one is a
natural "phase 2" conversation:

- **Payments are simulated.** Mobile money and card record a payment but no
  money moves; the gateway isn't connected. Cash-at-office is fully real.
- **No SMS yet.** Parents without smartphones can't be reached today. This is
  the first thing to build after signing, and worth raising before they do.
- **No bulk import.** Pupils are added one at a time; importing their existing
  spreadsheet is phase 2.
- **Photos** aren't uploadable yet — the website shows placeholders where
  imagery goes.
