resource "neon_project" "main" {
  name      = var.project_name
  region_id = var.neon_region
  org_id    = var.neon_org_id

  pg_version = 18

  history_retention_seconds = 21600

  # Configure default branch settings (optional)
  # branch {
  #   name          = "production"
  #   database_name = "app"
  #   role_name     = "app"
  # }

  # Autoscaling for the default branch (production) endpoint
  default_endpoint_settings {
    autoscaling_limit_min_cu = 0.25
    autoscaling_limit_max_cu = 0.5
  }
}

# ---------------------------------------------------------------------------
# A branch per non-production tier, branched from default
# ---------------------------------------------------------------------------
#
# `preview` is not a nicety. The Vercel build command runs `pnpm db:migrate`,
# so without a database of its own a preview deployment inherits whatever
# DATABASE_URL it is given and migrates THAT — which, before this existed, was
# production, on every pull request.
#
# `for_each` rather than two copies so a third tier (a branch per developer,
# say) is a one-line change.

locals {
  neon_branches = toset(["dev", "preview"])
}

resource "neon_branch" "env" {
  for_each = local.neon_branches

  project_id = neon_project.main.id
  parent_id  = neon_project.main.default_branch_id
  name       = each.key
}

resource "neon_endpoint" "env" {
  for_each = local.neon_branches

  project_id = neon_project.main.id
  branch_id  = neon_branch.env[each.key].id
  type       = "read_write"

  autoscaling_limit_min_cu = 0.25
  autoscaling_limit_max_cu = 0.5
}

resource "neon_role" "env" {
  for_each = local.neon_branches

  project_id = neon_project.main.id
  branch_id  = neon_branch.env[each.key].id
  name       = each.key

  # A branch must have a live compute endpoint before a role can be created on
  # it — the Neon API rejects the role otherwise. Nothing in the role's own
  # arguments references the endpoint, so the dependency has to be explicit.
  depends_on = [neon_endpoint.env]
}

resource "neon_database" "env" {
  for_each = local.neon_branches

  project_id = neon_project.main.id
  branch_id  = neon_branch.env[each.key].id
  name       = var.project_name
  owner_name = neon_role.env[each.key].name
}

# The connection string for each tier's own branch.
locals {
  neon_urls = {
    for k in local.neon_branches :
    k => "postgresql://${neon_role.env[k].name}:${neon_role.env[k].password}@${neon_endpoint.env[k].host}/${neon_database.env[k].name}?sslmode=require"
  }
}
