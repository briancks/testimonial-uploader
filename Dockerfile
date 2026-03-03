# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL=file:/app/seed/testimonials.db
RUN mkdir -p /app/seed public && npx prisma migrate deploy && npx prisma generate
RUN npx next build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/app/data/testimonials.db

# Install Litestream
RUN apk add --no-cache ca-certificates wget && \
    wget -qO- https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.tar.gz | tar xz -C /usr/local/bin/

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy pre-migrated empty database as seed
COPY --from=builder /app/seed/testimonials.db ./seed.db

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma client for runtime queries
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Litestream config and entrypoint
COPY litestream.yml /etc/litestream.yml
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

# Create data directory and ensure seed is readable
RUN mkdir -p data && chown -R nextjs:nodejs data && chmod 644 seed.db

USER nextjs

EXPOSE 8080

ENTRYPOINT ["./entrypoint.sh"]
