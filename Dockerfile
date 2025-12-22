# 1. Base image
FROM node:24-alpine AS base

# 2. Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Development stage (opzionale per l'uso locale)
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Il comando per il dev è gestito dal docker-compose.dev.yml

# 4. Builder stage (fondamentale per GitHub Actions)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variabili passate durante la build da GitHub Actions
ARG NEXT_PUBLIC_PORTAL_BASE_URL
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_CORS_ORIGIN
ARG NEXT_PUBLIC_MODE

# Iniezione delle variabili nell'ambiente di build di Next.js
ENV NEXT_PUBLIC_PORTAL_BASE_URL=$NEXT_PUBLIC_PORTAL_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_CORS_ORIGIN=$NEXT_PUBLIC_CORS_ORIGIN
ENV NEXT_PUBLIC_MODE=$NEXT_PUBLIC_MODE

ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=true

RUN npm run build

# 5. Runner stage (l'immagine finale leggera)
FROM base AS runner
WORKDIR /app

ENV DOCKER_BUILD=true
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Installazione di PM2 per la gestione del processo
RUN npm install --global pm2

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Configurazione permessi per Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copia dei file generati (standalone mode)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/ecosystem.config.js ./ecosystem.config.js

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Avvio con PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]