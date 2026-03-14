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
# Dev branch — branched from default, scales to zero when idle
# ---------------------------------------------------------------------------

resource "neon_branch" "dev" {
  project_id = neon_project.main.id
  parent_id  = neon_project.main.default_branch_id
  name       = "dev"
}

resource "neon_endpoint" "dev" {
  project_id = neon_project.main.id
  branch_id  = neon_branch.dev.id
  type       = "read_write"

  autoscaling_limit_min_cu = 0.25
  autoscaling_limit_max_cu = 0.5
}

resource "neon_role" "dev" {
  project_id = neon_project.main.id
  branch_id  = neon_branch.dev.id
  name       = "dev"
}

resource "neon_database" "dev" {
  project_id = neon_project.main.id
  branch_id  = neon_branch.dev.id
  name       = var.project_name
  owner_name = neon_role.dev.name
}
