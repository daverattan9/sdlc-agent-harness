output "web_url" {
  description = "Public URL of the Next.js web service"
  value       = render_web_service.web.url
}

output "codex_worker_url" {
  description = "Public URL of the Codex worker service"
  value       = render_web_service.codex.url
}
