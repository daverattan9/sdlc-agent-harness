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
  api_key = var.render_api_key
  owner_id = var.render_owner_id
}

# Private network for internal service communication
resource "render_private_network" "main" {
  name = "sdlc-harness-network"
}

# Next.js web service
resource "render_web_service" "web" {
  name   = "sdlc-harness-web"
  region = var.render_region
  plan   = "free"

  runtime_source = {
    native_runtime = {
      auto_deploy    = true
      branch         = "main"
      build_command  = "npm ci --workspace=apps/web && npm run build --workspace=apps/web"
      build_filter = {
        paths         = ["apps/web/**"]
        ignored_paths = []
      }
      repo_url      = var.github_repo_url
      runtime       = "node"
      start_command = "npm run start --workspace=apps/web"
    }
  }

  env_vars = {
    NODE_ENV = { value = "production" }
    # Auth0
    AUTH0_SECRET          = { secret = true, value = var.auth0_secret }
    AUTH0_DOMAIN          = { value = var.auth0_domain }
    AUTH0_CLIENT_ID       = { value = var.auth0_client_id }
    AUTH0_CLIENT_SECRET   = { secret = true, value = var.auth0_client_secret }
    APP_BASE_URL          = { value = var.app_base_url }
    # Notion
    NOTION_API_KEY        = { secret = true, value = var.notion_api_key }
    NOTION_DATABASE_ID    = { value = var.notion_database_id }
    NOTION_WEBHOOK_SECRET = { secret = true, value = var.notion_webhook_secret }
    # ElevenLabs
    ELEVENLABS_WEBHOOK_SECRET         = { secret = true, value = var.elevenlabs_webhook_secret }
    NEXT_PUBLIC_ELEVENLABS_AGENT_ID   = { value = var.elevenlabs_agent_id }
    # Anthropic / Claude
    ANTHROPIC_API_KEY = { secret = true, value = var.anthropic_api_key }
    # GitHub
    GITHUB_TOKEN          = { secret = true, value = var.github_token }
    GITHUB_REPO           = { value = var.github_repo }
    GITHUB_WEBHOOK_SECRET = { secret = true, value = var.github_webhook_secret }
    # Codex worker (internal)
    CODEX_WORKER_URL    = { value = "http://sdlc-harness-codex:3001" }
    CODEX_WORKER_SECRET = { secret = true, value = var.codex_worker_secret }
  }

  network_details = {
    private_network = render_private_network.main
  }
}

# Codex Docker worker (background worker)
resource "render_background_worker" "codex" {
  name   = "sdlc-harness-codex"
  region = var.render_region
  plan   = "free"

  runtime_source = {
    docker = {
      auto_deploy  = true
      branch       = "main"
      build_filter = {
        paths         = ["workers/codex-worker/**"]
        ignored_paths = []
      }
      context     = "workers/codex-worker"
      dockerfile_path = "workers/codex-worker/Dockerfile"
      repo_url    = var.github_repo_url
    }
  }

  env_vars = {
    NODE_ENV        = { value = "production" }
    OPENAI_API_KEY  = { secret = true, value = var.openai_api_key }
    GITHUB_TOKEN    = { secret = true, value = var.github_token }
    CODEX_WORKER_SECRET = { secret = true, value = var.codex_worker_secret }
    PORT            = { value = "3001" }
  }

  network_details = {
    private_network = render_private_network.main
  }
}
