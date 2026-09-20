# ---------------------------------------------------------------------------
# Deploy target: Vercel (the default)
# ---------------------------------------------------------------------------
#
# Gated on `var.deploy_vercel` so the shared services (Neon, Upstash,
# Cloudflare, Sentry) can be provisioned on their own for a container deploy.
# It defaults to true, so an existing terraform.tfvars needs no edit.

module "vercel" {
  count  = var.deploy_vercel ? 1 : 0
  source = "./modules/vercel"

  team_id      = var.vercel_team_id
  project_name = var.project_name
  github_repo  = var.github_repo

  app_env = local.app_env
}
