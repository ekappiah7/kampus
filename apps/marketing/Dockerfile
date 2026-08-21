# Build from the repo root: docker build -f apps/marketing/Dockerfile -t kampus-marketing .
FROM node:20-slim AS base
RUN corepack enable

FROM base AS builder
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
# The product site needs only the API URL, for the demo-request form.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @kampus/marketing build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/marketing/.next/standalone ./
COPY --from=builder /repo/apps/marketing/.next/static ./apps/marketing/.next/static
# Next's standalone output omits public/, so robots.txt and any screenshots
# added later have to be carried over explicitly.
COPY --from=builder /repo/apps/marketing/public ./apps/marketing/public

EXPOSE 8080
ENV PORT=8080 HOSTNAME=0.0.0.0
CMD ["node", "apps/marketing/server.js"]
