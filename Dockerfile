# syntax=docker/dockerfile:1

# ---- deps ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- build ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app

# PROMIS runs an Oracle release older than 12.1, which node-oracledb Thin mode
# cannot connect to (NJS-138), so the image ships Oracle Instant Client for Thick mode.
# Instant Client 21 is the newest release that still supports 11.2 databases.
# The full "basic" package (not basiclite) is needed for Thai character sets.
ARG INSTANTCLIENT_URL=https://download.oracle.com/otn_software/linux/instantclient/2119000/instantclient-basic-linux.x64-21.19.0.0.0dbru.zip
RUN apt-get update \
 && apt-get install -y --no-install-recommends libaio1 unzip curl ca-certificates \
 && mkdir -p /opt/oracle \
 && curl -fsSL "$INSTANTCLIENT_URL" -o /tmp/ic.zip \
 && unzip -q /tmp/ic.zip -d /opt/oracle \
 && mv /opt/oracle/instantclient_* /opt/oracle/instantclient \
 && rm /tmp/ic.zip \
 && apt-get purge -y unzip \
 && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    TZ=Asia/Bangkok \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    ORACLE_CLIENT_DIR=/opt/oracle/instantclient \
    LD_LIBRARY_PATH=/opt/oracle/instantclient

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Standalone tracing skips the Thick-mode native binary that oracledb loads dynamically
COPY --from=build --chown=node:node /app/node_modules/oracledb ./node_modules/oracledb

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fs http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
