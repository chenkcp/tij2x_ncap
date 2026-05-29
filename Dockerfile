# syntax=docker/dockerfile:1.7

# ---------- Frontend Build ----------
# Using Alpine here is fine for building assets, it keeps the environment clean
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --include=dev --no-audit && npm cache clean --force
COPY frontend/ ./

# Verify env file is present (remove after debugging)
RUN test -f .env.production && echo ".env.production found" || echo "WARNING: .env.production missing"

RUN npm run build

# ---------- Backend Runtime ----------
# We stick to Bookworm-slim because MS ODBC drivers are easier to manage on Debian
FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    PORT=5000
WORKDIR /app/backend

# Switch to root to perform system-level updates and driver installs
USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      curl gnupg ca-certificates apt-transport-https && \
    # Microsoft ODBC repo
    curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
      | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] \
      https://packages.microsoft.com/debian/12/prod bookworm main" \
      > /etc/apt/sources.list.d/microsoft-prod.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y --no-install-recommends \
      msodbcsql17 \
      unixodbc \
      unixodbc-dev \
    #   # CVE-2026-33845: GnuTLS DTLS integer underflow
    #   libgnutls30 \
    #   # CVE-2025-7458: SQLite integer overflow in ORDER BY
    #   libsqlite3-0 \
    #   # CVE-2026-7598: libssh2 userauth integer overflow
    #   libssh2-1 \
      # odbc native addon build tools
      build-essential \
      python3 && \
    #  zlib1g && \
    # Upgrade ALL installed packages — catches transitive CVEs
    # and pulls latest backports for libgnutls30, libsqlite3-0, libssh2-1
    apt-get upgrade -y && \
    #chown -R node:node /app/backend && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
# Set permissions before switching to non-root user
RUN chown -R node:node /app/backend
USER node

# Copy package files first to leverage Docker layer caching
COPY --chown=node:node backend/package*.json ./
# Use npm ci for reproducible builds
RUN npm ci --omit=dev --no-audit && npm cache clean --force
# Copy the rest of the backend source code
COPY --chown=node:node backend/ ./
# Copy the compiled frontend assets from the first stage
# Ensure your Express app is configured to serve the 'public' folder
COPY --from=frontend-build --chown=node:node /app/frontend/dist ./public

EXPOSE 5000
CMD ["node", "server.js"]