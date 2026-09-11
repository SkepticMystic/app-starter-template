# ---------------------------------------------------------------------------
# Values shared by more than one provider
# ---------------------------------------------------------------------------
#
# These exist so that two services cannot drift apart on a fact they both need.

locals {
  # The preview hostname, falling back to production's when unset.
  #
  # That fallback is a compromise rather than a good outcome: OAuth callbacks
  # from a preview deploy would then land on production. Set
  # `app_domain_preview` as soon as there is a hostname to point at.
  app_domain_preview = coalesce(var.app_domain_preview, var.app_domain)

  # Every hostname this app is served from.
  #
  # Turnstile and Sentry each need the full list or captcha verification and
  # error ingestion silently fail on the tier that is missing — and they read
  # this same local precisely so they cannot drift. `distinct` because the
  # preview entry collapses onto production whenever the fallback above is in
  # force.
  app_domains = distinct([
    var.app_domain,
    local.app_domain_preview,
    var.app_domain_dev,
  ])

  # The base URL per Vercel environment.
  base_urls = {
    production  = "https://${var.app_domain}"
    preview     = "https://${local.app_domain_preview}"
    development = "http://${var.app_domain_dev}:5173"
  }
}
