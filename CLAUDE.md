# SDLC Agent Harness — Project State for Next Agent

## What This Project Is

A full end-to-end agentic SDLC demo. A user reports a bug via voice (ElevenLabs), which creates a Notion ticket. A Claude agent researches and annotates it. Moving the ticket to "In Progress" dispatches a Codex CLI worker to write the fix and open a GitHub PR. CI runs, developer merges, ticket closes.

**Repo:** `https://github.com/daverattan9/sdlc-agent-harness`
**Branch for ongoing work:** `feature/sdlc-agent-harness`

---

## Deployed Services (Render free tier)

| Service | URL | Render ID | Status |
|---------|-----|-----------|--------|
| Next.js web app | `https://sdlc-harness-web.onrender.com` | `srv-d8n52ejbc2fs73ejs8o0` | **LIVE** |
| Codex Docker worker | `https://sdlc-harness-codex.onrender.com` | `srv-d8n52djbc2fs73ejs7fg` | **FAILING — see below** |

**Render API key:** `rnd_ltosBpZQoOqAM0XOo3Kew6nQ9eHs`

---

## Monorepo Structure

```
sdlc-project/
├── apps/web/                        # Next.js 16 monolith (frontend + API routes)
│   ├── app/
│   │   ├── dashboard/page.tsx       # Analytics dashboard (planted bug: conversion rate 0.00%)
│   │   ├── api/elevenlabs/route.ts  # Voice webhook receiver → creates Notion ticket
│   │   ├── api/notion/route.ts      # Notion status-change webhook → dispatches Codex job
│   │   ├── api/claude/route.ts      # Claude research agent trigger → annotates Notion ticket
│   │   ├── api/codex/route.ts       # Internal dispatcher → forwards job to Codex worker
│   │   └── api/github-webhook/      # GitHub merge webhook → closes Notion ticket
│   ├── lib/
│   │   ├── auth0.ts                 # Auth0Client singleton (Auth0 v4)
│   │   ├── claude/agent.ts          # Claude gpt-4o-mini research agent via AI SDK
│   │   ├── notion/tickets.ts        # Notion API client (createBugTicket, updateTicket)
│   │   └── webhooks/hmac.ts         # HMAC-SHA256 validation utilities
│   ├── proxy.ts                     # Next.js 16 middleware (Auth0 + /dashboard guard)
│   └── next.config.ts               # Security headers (X-Frame-Options, HSTS, etc.)
│
├── workers/codex-worker/            # Docker web service on Render
│   ├── Dockerfile                   # Multi-stage: builder (tsc) + production image
│   ├── src/
│   │   ├── server.ts                # Express HTTP server, /jobs endpoint
│   │   ├── codex-runner.ts          # Spawns Codex CLI with sanitised prompt
│   │   ├── github.ts                # git clone/branch/push + gh pr create
│   │   └── types.ts                 # CodexJob, JobRecord interfaces
│   ├── package.json
│   └── tsconfig.json
│
├── infra/terraform/
│   ├── main.tf                      # Render web services (web + codex)
│   ├── variables.tf
│   ├── outputs.tf
│   └── terraform.tfvars             # GITIGNORED — real secrets filled in by user
│
└── .github/workflows/ci.yml         # Build & Test + Verify Render deploy (on main push)
```

---

## What Is Complete

### Application code (all merged to main)
- **Auth0 v4** login/logout/callback via `proxy.ts` middleware; `/dashboard` protected
- **Analytics dashboard** at `/dashboard` with planted bug: `conversionRate = 0.00%`
- **ElevenLabs webhook** (`/api/elevenlabs`): HMAC-validated, handles `post_call_transcription` events, extracts structured fields from `data.analysis.data_collection_results` (bug_title, description, steps_to_reproduce, severity, affected_area), creates Notion ticket with status `Reported`
- **Notion webhook** (`/api/notion`): HMAC-validated, handles status changes (`Triaged` → dispatches Claude, `In Progress` → dispatches Codex)
- **Claude research agent** (`/api/claude`): uses `gpt-4o-mini` via Vercel AI SDK + Notion MCP, writes findings back to ticket
- **Codex worker dispatcher** (`/api/codex`): timing-safe auth, forwards job to Codex Docker worker
- **GitHub webhook** (`/api/github-webhook`): on PR merge, closes Notion ticket → `Done`
- **Codex worker**: Express server, clones repo, creates branch, runs Codex CLI, opens PR
- **Security hardening**: all webhooks HMAC-validated, `timingSafeEqual` everywhere, security headers, non-root Docker user, prompt injection sanitisation in `codex-runner.ts`
- **Terraform**: Render provider v1.8, both services provisioned, all env vars set
- **CI/CD**: Build & Test + `deploy-preview` job that triggers and polls Render deploys after every main merge

### Infrastructure
- Both Render services created and env vars configured via Terraform
- Web service build command correctly set to: `npm install --no-audit --include=dev && npm run build --workspace=apps/web`
- The `--include=dev` flag is **critical** — Render sets `NODE_ENV=production` at service level which skips devDependencies without it

---

## What Is Broken / Pending

### 1. Codex Docker worker — build failing (ACTIVE BUG)
**Status:** Still failing after latest fix attempt.

**Root cause chain:**
- Old Dockerfile: `COPY dist/ ./dist/` but `dist/` was never committed to git → failed in 6s
- Fixed with multi-stage Dockerfile (builder stage compiles TypeScript) → still failing in ~30s
- Unknown new error — need Render dashboard build logs to diagnose
- Suspect: `npm install -g @openai/codex` in the Dockerfile may be OOMing or timing out on Render free tier (512MB RAM), OR the apt-get GitHub CLI install fails

**Latest Dockerfile** (already pushed and live in repo):
```dockerfile
FROM node:20-slim AS builder
WORKDIR /build
COPY package*.json tsconfig.json ./
RUN npm install
COPY src/ ./src/
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y git curl gnupg \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [...] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y gh \
    && npm install -g @openai/codex \
    && rm -rf /var/lib/apt/lists/*
...
```

**To debug:** Check Render dashboard → sdlc-harness-codex → Logs for the last build. The exact Docker layer where it fails will be visible there.

**Likely fix:** If `npm install -g @openai/codex` is the culprit (it installs a very large package), consider installing it at runtime instead of build time, or check if there's a lighter install method.

### 2. Auth0 callback URL not configured (BLOCKER for login)
**Error:** Login redirects to Auth0, but callback fails because the Render URL is not in Auth0's allowed list.

**What needs to be done in Auth0 dashboard** (`https://manage.auth0.com`):
1. Go to Applications → Applications → the SDLC Harness app
2. Under "Application URIs" add:
   - **Allowed Callback URLs:** `https://sdlc-harness-web.onrender.com/auth/callback`
   - **Allowed Logout URLs:** `https://sdlc-harness-web.onrender.com`
   - **Allowed Web Origins:** `https://sdlc-harness-web.onrender.com`
3. Save changes

**Auth0 tenant:** `dev-lmbz0v1w3fvylu80.au.auth0.com`
**Auth0 Client ID:** `PDrDITQ5nYvyj0yDOWZp8h4n1O1IaSNR`

Note: The Management API token cannot be obtained from the web app credentials (client_credentials grant returns `access_denied`). Must be done in the dashboard or via a separate M2M application.

### 3. Notion webhook automations — not set up (cannot be done via API)
Must be done manually in Notion UI. Two automations needed on the "Bug Tickets" database (`ff384aa0-27da-4f7d-86fa-a99e0fccba73`):

**Automation A — "Investigate with Claude" button:**
- Trigger: Database button clicked (add a button property named "Investigate with Claude")
- Action: Send webhook to `https://sdlc-harness-web.onrender.com/api/claude`
- Headers: `x-notion-signature: <HMAC of body using NOTION_WEBHOOK_SECRET>`
- Body: `{ "notionPageId": "{{page.id}}", "bugDescription": "{{page.Description}}" }`

**Automation B — Status change to "In Progress":**
- Trigger: Status property changes to `In Progress`
- Action: Send webhook to `https://sdlc-harness-web.onrender.com/api/notion`
- Headers: `x-notion-signature: <HMAC of body using NOTION_WEBHOOK_SECRET>`
- Body: `{ "type": "status_change", "data": { "pageId": "{{page.id}}", "status": "In Progress", "ticketId": "{{page.TicketID}}" } }`

**NOTION_WEBHOOK_SECRET** (from Render env vars): `f01ecd0e2fb1e9f9d084ca7ebe955e2835a98dad8fd579fb6...`

### 4. ElevenLabs agent — dashboard configuration required
The ElevenLabs agent (`agent_1801kv2dcs87efhbejnbd9axhkk2`) needs to be configured in the ElevenLabs dashboard.

**A. Post-call webhook** (Developers > Webhooks):
- URL: `https://sdlc-harness-web.onrender.com/api/elevenlabs`
- Auth type: `hmac`
- Event: enable `transcript` (triggers `post_call_transcription` payload)

**B. Data Collection fields** (Agent > Analysis > Data Collection):
| Field | Type | Prompt for the agent |
|-------|------|---------------------|
| `bug_title` | string | "A short one-line title for the bug" |
| `description` | string | "Detailed description of what the user is experiencing" |
| `steps_to_reproduce` | string | "Step-by-step instructions to reproduce" |
| `severity` | string (enum: low/medium/high/critical) | "Issue severity" |
| `affected_area` | string | "Which part of the app is affected" |

**C. Payload structure**: fields arrive at `data.analysis.data_collection_results`, transcript at `data.transcript`, summary at `data.analysis.transcript_summary`

**D. Dev testing**: Use `POST /api/elevenlabs/test` (dev only, returns 404 in production) to create test tickets without a real voice call. Send a full `ElevenLabsWebhookPayload` JSON body.

### 5. End-to-end pipeline — never tested
No full run of the 10-step flow has been completed.

---

## Key Technical Decisions & Gotchas

### npm install on Render
- Render sets `NODE_ENV=production` at the **service level**, affecting ALL commands in the build
- `npm install` with `NODE_ENV=production` skips all `devDependencies`
- Fix: use `npm install --no-audit --include=dev` in build command
- This affects both `@tailwindcss/postcss` (needed by Turbopack) and `@types/*` (needed by TypeScript)

### Render Terraform free-tier bug
- `terraform apply` on free-tier services fails with: `maintenance mode can only be configured for non-free tier services`
- Workaround: use direct Render API PATCH to update service config:
  ```bash
  curl -X PATCH \
    -H "Authorization: Bearer rnd_ltosBpZQoOqAM0XOo3Kew6nQ9eHs" \
    -H "Content-Type: application/json" \
    -d '{"serviceDetails": {"envSpecificDetails": {"buildCommand": "..."}}}' \
    "https://api.render.com/v1/services/srv-d8n52ejbc2fs73ejs8o0"
  ```
- Note: the nested `serviceDetails.envSpecificDetails.buildCommand` path is required — top-level `buildCommand` does NOT work

### Auth0 v4 cookie config
- Auth0 v4 SDK enforces `httpOnly` and `secure` automatically — do NOT pass them as config options (causes TypeScript error)
- Cookie `sameSite: 'lax'` is required (not `'strict'`) — OAuth callback is cross-site

### Codex worker security
- `codex --approval-mode=auto-edit` accepts a free-text prompt — all `findings.*` fields from the webhook must be sanitised before interpolation (see `sanitiseText()` in `codex-runner.ts`)
- `/api/codex` auth uses `timingSafeEqual` — **not** string `!==`

### Next.js 16 / monorepo
- `apps/web/AGENTS.md` warns: "This version has breaking changes — read `node_modules/next/dist/docs/` before writing any code"
- Middleware file is `proxy.ts` (not `middleware.ts`) — this is a Next.js 16 convention
- Build command from root: `npm install --no-audit --include=dev && npm run build --workspace=apps/web`
- Start command: `npm run start --workspace=apps/web`

---

## Environment Variables (all set on Render)

| Variable | Description |
|----------|-------------|
| `AUTH0_SECRET` | Session secret |
| `AUTH0_DOMAIN` | `dev-lmbz0v1w3fvylu80.au.auth0.com` |
| `AUTH0_CLIENT_ID` | `PDrDITQ5nYvyj0yDOWZp8h4n1O1IaSNR` |
| `AUTH0_CLIENT_SECRET` | (set) |
| `APP_BASE_URL` | `https://sdlc-harness-web.onrender.com` |
| `NOTION_API_KEY` | (set) |
| `NOTION_DATABASE_ID` | `ff384aa0-27da-4f7d-86fa-a99e0fccba73` |
| `NOTION_WEBHOOK_SECRET` | (set) |
| `ELEVENLABS_WEBHOOK_SECRET` | (set) |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | `agent_1801kv2dcs87efhbejnbd9axhkk2` |
| `OPENAI_API_KEY` | (set — used by both Claude agent and Codex CLI) |
| `GITHUB_TOKEN` | (set) |
| `GITHUB_REPO` | `daverattan9/sdlc-agent-harness` |
| `GITHUB_WEBHOOK_SECRET` | (set) |
| `CODEX_WORKER_URL` | `https://sdlc-harness-codex.onrender.com` |
| `CODEX_WORKER_SECRET` | (set) |

---

## Immediate Next Steps (priority order)

1. **Fix Auth0 callback URLs** — update Auth0 dashboard to allow `https://sdlc-harness-web.onrender.com/auth/callback`. This is a manual step in the Auth0 dashboard.

2. **Debug + fix Codex Docker build** — check Render dashboard logs for `sdlc-harness-codex` to see exactly which Docker layer fails. If it's `npm install -g @openai/codex`, consider a different install strategy or investigate the package size.

3. **Set up Notion automations** — manually configure the two database automations (Claude trigger button + In Progress status webhook) in Notion UI.

4. **Configure ElevenLabs agent webhook** — point the agent's post-conversation webhook to `/api/elevenlabs`.

5. **Run end-to-end test** — follow the 10-step flow from the design spec.

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):
- **Build & Test**: `npm install --no-audit` → type-check → Next.js build → Codex worker build → tests
- **Verify Render deploy** (main push only): triggers both Render services via API, polls every 15s until `live` or `failed`

CI requires `RENDER_API_KEY` secret in GitHub repo settings.

CI currently passes Build & Test. The deploy-preview step passes for the web service but fails for Codex worker (Docker build failure).
