output "web_service_url" {
  description = "Public URL of the Next.js web service"
  value       = render_web_service.web.url
}

output "private_network_id" {
  description = "Private network ID"
  value       = render_private_network.main.id
}
