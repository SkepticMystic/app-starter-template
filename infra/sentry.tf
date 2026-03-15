resource "sentry_project" "main" {
  organization = var.sentry_org_slug
  teams        = [var.sentry_team_slug]

  name = var.project_name

  platform = "javascript-sveltekit"

  # We make one ourselves, below
  default_key = false

  # Auto resolve issues after this many hours
  resolve_age = 720 # One month

  client_security = {
    allowed_domains = [
      "https://${var.app_domain}",
      "http://${var.app_domain_dev}:5173",
    ]
  }
}

resource "sentry_key" "main" {
  name         = var.project_name
  project      = sentry_project.main.slug
  organization = var.sentry_org_slug
}

