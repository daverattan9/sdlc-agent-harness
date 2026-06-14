terraform {
  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.3"
    }
  }
  required_version = ">= 1.5"
}

provider "render" {
  api_key  = var.render_api_key
  owner_id = var.render_owner_id
}

# ── Codex worker (free web service, Docker) ───────────────────────────────────
# Deployed first so its URL can be referenced by the web service.
resource "render_web_service" "codex" {
  name   = "sdlc-harness-codex"
  region = var.render_region
  plan   = "free"

  runtime_source = {
    docker = {
      auto_deploy     = true
      branch          = "main"
      build_filter = {
        paths = ["workers/codex-worker/**"]
      }
      context         = "workers/codex-worker"
      dockerfile_path = "workers/codex-worker/Dockerfile"
      repo_url        = var.github_repo_url
    }
  }

  health_check_path = "/health"

  env_vars = {
    NODE_ENV            = { value = "production" }
    PORT                = { value = "10000" }
    OPENAI_API_KEY      = { value = var.openai_api_key }
    GITHUB_TOKEN        = { value = var.github_token }
    CODEX_WORKER_SECRET = { value = var.codex_worker_secret }
  }
}

# ── Next.js web service (free) ────────────────────────────────────────────────
resource "render_web_service" "web" {
  name          = "sdlc-harness-web"
  region        = var.render_region
  plan          = "free"
  start_command = "npm run start --workspace=apps/web"

  runtime_source = {
    native_runtime = {
      auto_deploy   = true
      branch        = "main"
      build_command = "npm ci --workspace=apps/web && npm run build --workspace=apps/web"
      build_filter = {
        paths = ["apps/web/**"]
      }
      repo_url = var.github_repo_url
      runtime  = "node"
    }
  }

  env_vars = {
    NODE_ENV = { value = "production" }
    # Auth0
    AUTH0_SECRET        = { value = var.auth0_secret }
    AUTH0_DOMAIN        = { value = var.auth0_domain }
    AUTH0_CLIENT_ID     = { value = var.auth0_client_id }
    AUTH0_CLIENT_SECRET = { value = var.auth0_client_secret }
    APP_BASE_URL        = { value = var.app_base_url }
    # Notion
    NOTION_API_KEY        = { value = var.notion_api_key }
    NOTION_DATABASE_ID    = { value = var.notion_database_id }
    NOTION_WEBHOOK_SECRET = { value = var.notion_webhook_secret }
    # ElevenLabs
    ELEVENLABS_WEBHOOK_SECRET       = { value = var.elevenlabs_webhook_secret }
    NEXT_PUBLIC_ELEVENLABS_AGENT_ID = { value = var.elevenlabs_agent_id }
    # OpenAI (research agent)
    OPENAI_API_KEY = { value = var.openai_api_key }
    # GitHub
    GITHUB_TOKEN          = { value = var.github_token }
    GITHUB_REPO           = { value = var.github_repo }
    GITHUB_WEBHOOK_SECRET = { value = var.github_webhook_secret }
    # Codex worker
    CODEX_WORKER_URL    = { value = render_web_service.codex.url }
    CODEX_WORKER_SECRET = { value = var.codex_worker_secret }
  }
}
