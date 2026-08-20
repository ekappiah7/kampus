# Parked — native Expo shell

This is an early Expo/React Native scaffold of the parent app. It is **not built,
typechecked, or deployed**, and it is excluded from the pnpm workspace so it cannot
break CI while it sits idle.

## Why it's parked

The parent app now ships as an installable PWA at `apps/parent-app`, which is the
better fit for a demo and for most Ghanaian parents: no app store, no install
friction, works from a link, and updates the moment we deploy. Native builds need
`eas build`, an Apple Developer account ($99/yr) and a Google Play account ($25),
which only make sense once there's a signed contract.

## What's here vs. what you'd keep

The screens in this folder were written against an older version of the API and
would need reworking — treat them as a layout reference, not working code. What
carries over unchanged when you do go native:

- `apps/api` — the same backend serves web, PWA and native alike.
- `packages/shared-types` and `packages/api-client` — already platform-agnostic.
- `packages/design-tokens` — the RN theme export is still there and current.

## Picking it back up

1. Re-add `apps/mobile` to `pnpm-workspace.yaml`.
2. Reinstall, then update the screens against the current `@kampus/api-client`
   surface (the parent-app PWA under `apps/parent-app` is the reference for what
   each screen should call).
3. `eas build` for TestFlight / Play internal testing.
