variable "render_api_key" {
  description = "Render API key"
  type        = string
  sensitive   = true
}

variable "render_owner_id" {
  description = "Render owner/team ID"
  type        = string
}

variable "render_region" {
  description = "Render deployment region"
  type        = string
  default     = "oregon"
}

variable "github_repo_url" {
  description = "GitHub repository URL (https://github.com/owner/repo)"
  type        = string
}

variable "github_repo" {
  description = "GitHub repo in owner/repo format"
  type        = string
}

variable "github_token" {
  description = "GitHub personal access token (repo scope)"
  type        = string
  sensitive   = true
}

variable "github_webhook_secret" {
  description = "Secret for validating GitHub webhooks"
  type        = string
  sensitive   = true
}

# Auth0
variable "auth0_secret" {
  description = "Auth0 session secret (random 32+ chars)"
  type        = string
  sensitive   = true
}

variable "auth0_domain" {
  description = "Auth0 domain (e.g. your-tenant.auth0.com)"
  type        = string
}

variable "auth0_client_id" {
  description = "Auth0 application client ID"
  type        = string
}

variable "auth0_client_secret" {
  description = "Auth0 application client secret"
  type        = string
  sensitive   = true
}

variable "app_base_url" {
  description = "Public URL of the deployed web app"
  type        = string
}

# Notion
variable "notion_api_key" {
  description = "Notion internal integration token"
  type        = string
  sensitive   = true
}

variable "notion_database_id" {
  description = "Notion Bug Tickets database ID"
  type        = string
}

variable "notion_webhook_secret" {
  description = "HMAC secret for Notion automation webhooks"
  type        = string
  sensitive   = true
}

# ElevenLabs
variable "elevenlabs_webhook_secret" {
  description = "ElevenLabs webhook signing secret"
  type        = string
  sensitive   = true
}

variable "elevenlabs_agent_id" {
  description = "ElevenLabs Conversational AI agent ID"
  type        = string
}

# AI
variable "anthropic_api_key" {
  description = "Anthropic API key for Claude"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key for Codex CLI"
  type        = string
  sensitive   = true
}

# Internal
variable "codex_worker_secret" {
  description = "Shared secret between web app and Codex worker"
  type        = string
  sensitive   = true
}
