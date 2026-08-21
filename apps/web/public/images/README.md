# Website images

Drop image files in **this folder** using the exact filenames below. The site picks
them up automatically — no code changes.

Any slot without a file shows a dashed placeholder **printing the filename it's
waiting for**, so you can open the site, see what's missing, and name the file
accordingly. Nothing breaks while photos are outstanding.

## Filenames

| File | Where it appears | Suggested size |
|---|---|---|
| `crest.png` | Nav bar + footer logo | 512×512, transparent PNG |
| `hero.jpg` | Big photo beside the headline | 1600×1200 (landscape) |
| `about.jpg` | "Our story" section | 1200×1000 |
| `gallery-1.jpg` | Gallery — large feature tile | 1200×1200 (square) |
| `gallery-2.jpg` … `gallery-5.jpg` | Gallery — small tiles | 800×800 (square) |
| `gallery-6.jpg` | Gallery — wide tile | 1600×800 (landscape) |
| `map.jpg` | Contact section | 1200×900 |

### Staff photos

`staff-<name>.jpg`, using the person's name in lowercase with hyphens and **no title**:

- Mr. Collins Amofa Owusu → `staff-collins-amofa-owusu.jpg`
- Mrs. Abigail Bentil → `staff-abigail-bentil.jpg`

Head-and-shoulders, roughly square, 600×600. They're shown as circles, so keep the
face centred.

### Parent photos (testimonials)

Same pattern with a `parent-` prefix: `parent-mrs-adjei.jpg`. 400×400.

## Practical notes

- **Format:** `.jpg` for photographs, `.png` only for the crest (it needs
  transparency). Filenames are case-sensitive — all lowercase.
- **Size:** keep each file under ~400KB. Many parents are on mobile data, and a
  5MB photo is the difference between a site that loads and one they give up on.
  Squoosh (squoosh.app) or any "compress JPEG" tool will do it in seconds.
- **Permission:** get written consent from parents before putting a child's face
  on a public website. Photos of pupils from behind, or in group activity shots,
  are a safer default.

## Publishing changes

This folder is served directly by Firebase Hosting, so adding or replacing an
image needs one command — no container rebuild, no downtime:

```bash
npx firebase-tools deploy --only hosting:web --project akampuz
```

It takes about twenty seconds. If a photo still looks like the old one, it's your
browser cache — hard-refresh (Ctrl/Cmd + Shift + R).

## The other way: paste a URL

Staff photos, parent photos and gallery images can also be set from the portal
(**Website → Testimonials / Gallery**) by pasting an image URL. A URL always wins
over a file in this folder. That route needs no redeploy, so it's the better
option if the school will be changing images often — but the images must be hosted
somewhere public.
