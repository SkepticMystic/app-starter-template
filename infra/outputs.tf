# ---------------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------------
#
# Nothing secret is output. Reading a credential back out with `tofu output`
# only widens its exposure — it lands in shell history, CI logs and scrollback —
# and everything here is already readable from the relevant dashboard.

output "vercel_project_id" {
  description = "Vercel project id."
  value       = vercel_project.app.id
}

output "neon_project_id" {
  description = "Neon project id."
  value       = neon_project.main.id
}

output "neon_branch_ids" {
  description = "Neon branch id per non-production tier."
  value       = { for k, b in neon_branch.env : k => b.id }
}

output "r2_bucket_names" {
  description = "R2 bucket name per tier."
  value = {
    prod = cloudflare_r2_bucket.main.name
    dev  = cloudflare_r2_bucket.dev.name
  }
}

# Handy for registering OAuth redirect origins: every origin the app is served
# from, in one command.
output "base_urls" {
  description = "Base URL per Vercel environment."
  value       = local.base_urls
}
