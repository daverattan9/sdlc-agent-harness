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

RUN apt-get update && apt-get install -y \
    git \
    curl \
    gnupg \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update && apt-get install -y gh \
    && npm install -g @openai/codex \
    && rm -rf /var/lib/apt/lists/*

# Configure git for the worker
RUN git config --global user.email "codex-worker@sdlc-harness.internal" \
    && git config --global user.name "Codex Worker"

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /build/dist/ ./dist/

# Run as non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs appuser
USER appuser

EXPOSE 10000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
