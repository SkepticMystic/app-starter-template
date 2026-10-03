# ---------------------------------------------------------------------------
# Vercel deploy target
# ---------------------------------------------------------------------------
#
# Renders the root module's `app_env` manifest into Vercel project env vars.
# Vercel-specific settings (regions, build command, git integration) live here
# and nowhere else, so a second target can be added beside this module without
# touching the shared services or the manifest.

terraform {
  required_providers {
    vercel = {
      source = "vercel/vercel"
    }
  }
}

resource "vercel_project" "app" {
  team_id   = var.team_id
  name      = var.project_name
  framework = "sveltekit"

  # NOTE: this is why every tier needs its own database — a push to `main`
  # migrates production with no review gate between merge and schema change.
  build_command    = "pnpm build && pnpm db:migrate"
  output_directory = ".vercel/output"

  resource_config = {
    function_default_regions = ["cpt1"]
  }

  # Still on, though no application code reads a VERCEL_* variable any more:
  # `APP_ENV` replaced `VERCEL_ENV` so the tier name means something off Vercel
  # too. Left enabled because the build itself uses `VERCEL=1` to pick the
  # adapter in vite.config.ts.
  automatically_expose_system_environment_variables = true

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = "main"
  }
}

# One resource per manifest entry, keyed by the manifest's own map key, so a
# changed variable produces a targeted plan diff rather than replacing a bundle.
resource "vercel_project_environment_variable" "env" {
  for_each = var.app_env

  team_id    = var.team_id
  project_id = vercel_project.app.id

  key       = each.value.key
  value     = each.value.value
  target    = toset(each.value.targets)
  sensitive = each.value.sensitive
}
