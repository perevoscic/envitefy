# syntax=docker/dockerfile:1.7

# 1) Base image for all stages
FROM node:20-slim AS base

# Ensure production-like environment and faster installs
ENV NODE_ENV=production

# Required for sharp native deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    python3 make g++ libc6 libvips-dev ca-certificates \
    && rm -rf /var/lib/apt/lists/*


# 2) Dependencies stage: install all deps using npm ci
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev


# 3) Build stage: build Next.js app (standalone)
FROM deps AS build
WORKDIR /app
COPY . .
# Ensure Next.js can use correct timezone and node options if needed
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# 4) Production runtime stage
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 nodegrp \
    && useradd -u 1001 -g nodegrp -m nodeusr

ENV NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=8080

# Copy only what we need to run the server
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# Healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "require('http').get('http://localhost:'+ (process.env.PORT || 8080) +'/api/health');" || exit 1

USER nodeusr

EXPOSE 8080
CMD ["sh", "-c", "echo Starting Next server on PORT=${PORT} HOSTNAME=${HOSTNAME}; node server.js"]


