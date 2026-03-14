# NOTE: This doesn't actually work. The team_id is not the same as the slug
# output "vercel_project_url" {
#   description = "Vercel project dashboard URL."
#   value       = "https://vercel.com/${var.vercel_team_id}/${vercel_project.app.name}"
# }

# output "r2_prod_api_token" {
#   description = "API token with R2 bucket item read/write access for the prod bucket."
#   value       = cloudflare_account_token.r2_prod.value
#   sensitive   = true
# }

# output "r2_dev_api_token" {
#   description = "API token with R2 bucket item read/write access for the dev bucket."
#   value       = cloudflare_account_token.r2_dev.value
#   sensitive   = true
# }
