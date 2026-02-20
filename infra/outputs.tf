# NOTE: This doesn't actually work. The team_id is not the same as the slug
output "vercel_project_url" {
  description = "Vercel project dashboard URL."
  value       = "https://vercel.com/${var.vercel_team_id}/${vercel_project.app.name}"
}