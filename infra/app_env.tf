# ---------------------------------------------------------------------------
# Application environment, per tier
# ---------------------------------------------------------------------------
#
# This replaces the ~35 `vercel_project_environment_variable` resources that
# lived in infra/vercel.tf.
#
# The property those had — OpenTofu is the sole writer, and anything set by
# hand elsewhere is overwritten on the next apply — is preserved. The chain is
# now: this file -> a GitHub Actions secret (infra/github.tf) -> a 0600 file on
# the box -> compose `env_file`. Editing that file on the box by hand survives
# exactly until the next deploy.
#
# The old shape was one resource per variable, deliberately, so that changing a
# single value produced a small, targeted plan diff. That granularity existed
# because Vercel's API is per-variable. The consumer is now a FILE, so there is
# nowhere for it to land: the plan shows one `(sensitive value)` changing.
# Accepted knowingly, and bought back in exchange for values that are no longer
# readable in anyone's dashboard.

locals {
  # Shared by every tier.
  app_env_common = {
    CLOUDFLARE_ACCOUNT_ID    = var.cloudflare_account_id
    GOOGLE_CLIENT_ID         = var.google_client_id
    GOOGLE_CLIENT_SECRET     = var.google_client_secret
    POCKETID_BASE_URL        = var.pocketid_base_url
    POCKETID_CLIENT_ID       = var.pocketid_client_id
    POCKETID_CLIENT_SECRET   = var.pocketid_client_secret
    EMAIL_FROM               = var.email_from
    RESEND_API_KEY           = var.resend_api_key
    CAPTCHA_SECRET_KEY       = cloudflare_turnstile_widget.main.secret
    PUBLIC_CAPTCHA_SITE_KEY  = cloudflare_turnstile_widget.main.sitekey
    PUBLIC_SENTRY_DSN        = sentry_key.main.dsn["public"]
    PUBLIC_UMAMI_BASE_URL    = var.umami_base_url
    PUBLIC_UMAMI_WEBSITE_ID  = var.umami_website_id
    CLOUDINARY_CLOUD_NAME    = var.cloudinary_cloud_name
    CLOUDINARY_API_KEY       = var.cloudinary_api_key
    CLOUDINARY_API_SECRET    = var.cloudinary_api_secret
    CLOUDINARY_UPLOAD_PRESET = var.cloudinary_upload_preset
    OPENAI_API_KEY           = var.openai_api_key
    UPSTASH_REDIS_REST_URL   = "https://${upstash_redis_database.main.endpoint}"
    UPSTASH_REDIS_REST_TOKEN = upstash_redis_database.main.rest_token

    # Nothing reads these logs on a TTY any more.
    NO_COLOR = "true"
  }

  # Per tier.
  #
  # APP_ENV replaces VERCEL_ENV as the Redis keyspace segment. It is the
  # load-bearing one (see src/lib/server/db/redis.db.ts) and its VALUES are
  # frozen: changing one abandons a keyspace rather than migrating it, and
  # sessions live only in Redis.
  #
  # ORIGIN is adapter-node's, and src/hooks.server.ts refuses to boot unless it
  # equals PUBLIC_BASE_URL — so they are written from the same local here
  # rather than as two independent strings.
  app_env = {
    production = merge(local.app_env_common, {
      APP_ENV              = "production"
      PUBLIC_BASE_URL      = local.base_urls.production
      ORIGIN               = local.base_urls.production
      DATABASE_URL         = neon_project.main.connection_uri
      BETTER_AUTH_SECRET   = var.better_auth_secret
      PAYSTACK_SECRET_KEY  = var.paystack_secret_key
      R2_BUCKET_NAME       = cloudflare_r2_bucket.main.name
      R2_ACCESS_KEY_ID     = module.r2_api_token_prod.id
      R2_SECRET_ACCESS_KEY = module.r2_api_token_prod.secret
      LOG_LEVEL            = var.log_level
    })

    preview = merge(local.app_env_common, {
      APP_ENV = "preview"

      # Was `local.prod_and_preview` in vercel.tf, which gave preview
      # PRODUCTION's base URL — so every OAuth callback and email link from a
      # preview deploy pointed at production. `locals.tf` already computes the
      # right value; use it.
      PUBLIC_BASE_URL = local.base_urls.preview
      ORIGIN          = local.base_urls.preview

      DATABASE_URL         = local.neon_urls["preview"]
      BETTER_AUTH_SECRET   = var.better_auth_secret
      PAYSTACK_SECRET_KEY  = var.paystack_secret_key_dev
      R2_BUCKET_NAME       = cloudflare_r2_bucket.dev.name
      R2_ACCESS_KEY_ID     = module.r2_api_token_dev.id
      R2_SECRET_ACCESS_KEY = module.r2_api_token_dev.secret
      LOG_LEVEL            = "debug"
    })
  }

  # Rendered as a dotenv blob per tier. Values are not quoted: docker compose's
  # env_file treats the whole remainder of the line as the value, and quoting
  # would embed the quotes.
  app_env_files = {
    for tier, vars in local.app_env :
    tier => join("\n", [for k, v in vars : "${k}=${v}"])
  }
}
