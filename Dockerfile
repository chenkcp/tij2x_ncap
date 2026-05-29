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
# The backend uses the Node mssql package through MSSQLDbProvider, so no ODBC driver is required.
FROM node:22-alpine

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    PORT=5000
WORKDIR /app/backend

# Switch to root for system package updates and permissions
USER root

RUN apk add --no-cache ca-certificates && \
    apk upgrade --no-cache
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