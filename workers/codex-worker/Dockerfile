# Stage 1: compile TypeScript
FROM node:20-slim AS builder
WORKDIR /build
COPY package*.json tsconfig.json ./
RUN npm install
COPY src/ ./src/
RUN npm run build

# Stage 2: production image
FROM node:20-slim

WORKDIR /app

# Only git is needed — codex ships as a local dep, gh CLI replaced by GitHub API
RUN apt-get update && apt-get install -y git --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Configure git for the worker
RUN git config --global user.email "codex-worker@sdlc-harness.internal" \
    && git config --global user.name "Codex Worker"

COPY package.json ./
RUN npm install --omit=dev --no-audit

COPY --from=builder /build/dist/ ./dist/

# Make the locally installed codex CLI available in PATH
ENV PATH="/app/node_modules/.bin:${PATH}"

# Run as non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs appuser
USER appuser

EXPOSE 10000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
