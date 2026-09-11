resource "sentry_project" "main" {
  organization = var.sentry_org_slug
  teams        = [var.sentry_team_slug]

  name = var.project_name

  platform = "javascript-sveltekit"

  # Auto resolve issues after this many hours
  resolve_age = 720 # One month

  client_security = {
    # Bare hostnames, and the full list including preview.
    #
    # Sentry matches a scheme-less allowed domain against the hostname alone, so
    # one entry covers http and https and any port — which is what makes the
    # local dev origin work without enumerating its port. Omitting preview means
    # browser errors from preview deploys are rejected at ingest.
    allowed_domains = local.app_domains
  }
}

resource "sentry_key" "main" {
  name         = var.project_name
  project      = sentry_project.main.slug
  organization = var.sentry_org_slug
}

