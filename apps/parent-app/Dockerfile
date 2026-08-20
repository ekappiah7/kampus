# Build from the repo root: docker build -f apps/parent-app/Dockerfile -t kampus-parent-app .
FROM node:20-slim AS base
RUN corepack enable

FROM base AS builder
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SCHOOL_SUBDOMAIN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SCHOOL_SUBDOMAIN=$NEXT_PUBLIC_SCHOOL_SUBDOMAIN
RUN pnpm --filter @kampus/parent-app build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/parent-app/.next/standalone ./
COPY --from=builder /repo/apps/parent-app/.next/static ./apps/parent-app/.next/static
# Next's standalone output omits public/ — the PWA manifest, service worker
# and icons live there, so copy it explicitly or the app won't be installable.
COPY --from=builder /repo/apps/parent-app/public ./apps/parent-app/public

EXPOSE 8080
ENV PORT=8080 HOSTNAME=0.0.0.0
CMD ["node", "apps/parent-app/server.js"]
