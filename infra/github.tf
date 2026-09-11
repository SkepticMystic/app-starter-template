# ---------------------------------------------------------------------------
# GitHub Actions configuration
# ---------------------------------------------------------------------------
#
# The deploy pipeline already has to be trusted with SSH access to the box, so
# it is already inside the trust boundary — handing it the environment blobs
# adds no new party. Secrets here are write-only in the GitHub UI, which is the
# structural fix for every `sensitive = false` in the file this replaces:
# DATABASE_URL, BETTER_AUTH_SECRET, R2_SECRET_ACCESS_KEY, PAYSTACK_SECRET_KEY
# and OPENAI_API_KEY were all readable from the Vercel dashboard by anyone on
# the team, each with `# sensitive = true` commented out directly above it.

locals {
  github_repo_name = split("/", var.github_repo)[1]
}

# One secret per tier, not one per variable — see the note in app_env.tf.
resource "github_actions_secret" "app_env" {
  for_each = local.app_env_files

  repository      = local.github_repo_name
  secret_name     = "APP_ENV_${upper(each.key)}"
  plaintext_value = each.value
}

# Never wired up before: `sentry_auth_token` existed as a variable and was
# referenced by no resource, so @sentry/vite-plugin has never uploaded a source
# map. That mattered less on Vercel; it matters a great deal once you own the
# runtime, because a minified stack trace is all you get otherwise.
resource "github_actions_secret" "sentry_auth_token" {
  repository      = local.github_repo_name
  secret_name     = "SENTRY_AUTH_TOKEN"
  plaintext_value = var.sentry_auth_token
}

resource "github_actions_secret" "deploy_ssh_key" {
  repository      = local.github_repo_name
  secret_name     = "DEPLOY_SSH_KEY"
  plaintext_value = var.deploy_ssh_private_key
}

resource "github_actions_secret" "deploy_known_hosts" {
  repository      = local.github_repo_name
  secret_name     = "DEPLOY_KNOWN_HOSTS"
  plaintext_value = var.deploy_known_hosts
}

# Not secret: these are baked into the client bundle at build time and shipped
# to every browser anyway. Variables rather than secrets so they are readable
# in a build log, which is exactly where you want to see them when a DSN is
# wrong.
#
# The Sentry pair is not decoration: vite.config.ts passes no
# sourceMapsUploadOptions, so sentry-cli takes org and project from the
# environment. An auth token without them uploads nothing, silently.
resource "github_actions_variable" "build" {
  for_each = {
    PUBLIC_SENTRY_DSN       = sentry_key.main.dsn["public"]
    PUBLIC_UMAMI_BASE_URL   = var.umami_base_url
    PUBLIC_UMAMI_WEBSITE_ID = var.umami_website_id
    PUBLIC_CAPTCHA_SITE_KEY = cloudflare_turnstile_widget.main.sitekey
    SENTRY_ORG              = var.sentry_org_slug
    SENTRY_PROJECT          = sentry_project.main.slug
    APP_DOMAIN              = var.app_domain
    STAGING_DOMAIN          = local.app_domain_preview
    DEPLOY_HOST             = var.deploy_host
  }

  repository    = local.github_repo_name
  variable_name = each.key
  value         = each.value
}
