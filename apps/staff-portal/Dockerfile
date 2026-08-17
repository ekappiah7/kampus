# Build from the repo root: docker build -f apps/staff-portal/Dockerfile -t kampus-staff-portal .
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
RUN pnpm --filter @kampus/staff-portal build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/staff-portal/.next/standalone ./
COPY --from=builder /repo/apps/staff-portal/.next/static ./apps/staff-portal/.next/static

EXPOSE 8080
ENV PORT=8080 HOSTNAME=0.0.0.0
CMD ["node", "apps/staff-portal/server.js"]
