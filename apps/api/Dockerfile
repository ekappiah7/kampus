# Build from the repo root: docker build -f apps/api/Dockerfile -t kampus-api .
# node:20-bookworm (not -slim) is used deliberately: Prisma's query engine is a
# native binary that dlopen()s libssl at runtime, and slim doesn't ship it —
# that's a silent crash on first DB query, not a build-time failure.
FROM node:20-bookworm AS base
RUN corepack enable

FROM base AS builder
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @kampus/db generate
RUN pnpm --filter @kampus/api build
# esbuild bundles every dependency except @prisma/client (kept external because its
# generated query engine binary can't be bundled). pnpm keeps that package — and its
# sibling `.prisma/client` (the actual generated code + engine binary; `@prisma/client`
# just re-exports it) — as symlinks into its content-addressable store rather than
# hoisting them to the root node_modules, so dereference both into one flat,
# self-contained folder here. That's the only runtime dependency the image needs.
RUN REAL_NM="$(dirname "$(dirname "$(readlink -f apps/api/node_modules/@prisma/client)")")" \
  && mkdir -p /prisma-standalone \
  && cp -RL "$REAL_NM/@prisma" /prisma-standalone/@prisma \
  && cp -RL "$REAL_NM/.prisma" /prisma-standalone/.prisma

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /prisma-standalone/@prisma ./node_modules/@prisma
COPY --from=builder /prisma-standalone/.prisma ./node_modules/.prisma
COPY --from=builder /repo/packages/db/prisma ./packages/db/prisma
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/apps/api/package.json ./package.json

EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/bundle.js"]
