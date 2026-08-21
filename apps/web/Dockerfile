# Build from the repo root: docker build -f apps/web/Dockerfile -t kampus-web .
FROM node:20-slim AS base
RUN corepack enable

FROM base AS builder
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
# The marketing site has no auth/DB dependency — it only needs NEXT_PUBLIC_* at build time.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SCHOOL_SUBDOMAIN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SCHOOL_SUBDOMAIN=$NEXT_PUBLIC_SCHOOL_SUBDOMAIN
RUN pnpm --filter @kampus/web build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
# Next's standalone output omits public/ — the crest, images and robots.txt
# have to be carried over explicitly or every /images/* request 404s.
COPY --from=builder /repo/apps/web/public ./apps/web/public

EXPOSE 8080
ENV PORT=8080 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
