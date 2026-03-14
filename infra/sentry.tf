resource "sentry_project" "main" {
  organization = var.sentry_org_slug

  teams = [var.sentry_team_slug]
  name  = var.project_name

  platform = "javascript-sveltekit"
}

resource "sentry_key" "main" {
  name         = var.project_name
  project      = sentry_project.main.slug
  organization = var.sentry_org_slug
}