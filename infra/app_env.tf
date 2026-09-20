# ---------------------------------------------------------------------------
# Application environment manifest
# ---------------------------------------------------------------------------
#
# The set of variables the app needs, and their values, independent of WHERE it
# is deployed. `modules/vercel` renders this into Vercel project env vars; a
# second target would render the same map its own way.
#
# This file used to be fused into `vercel.tf`, which made Vercel the definition
# of the app's environment rather than one consumer of it.
#
# Every key here must also appear in `/.env.example`, which is what people copy
# for local development. `src/test/env.test.ts` fails the build if a variable
# the code reads is missing from that file.
#
# NOTE: `sensitive` mirrors today's values exactly — all `false`, because Vercel
# refuses to return a sensitive value and that broke `vercel env pull`. Flipping
# them is a separate decision, not a side effect of this reorganisation.

locals {
  # Map key = the old resource name, so `moved.tf` is a 1:1 textual mapping and
  # the migration is not a destroy/recreate.
  app_env = {
    CLOUDFLARE_ACCOUNT_ID    = { key = "CLOUDFLARE_ACCOUNT_ID", value = var.cloudflare_account_id, targets = ["production", "preview", "development"], sensitive = false }
    R2_BUCKET_NAME           = { key = "R2_BUCKET_NAME", value = cloudflare_r2_bucket.main.name, targets = ["production", "preview"], sensitive = false }
    R2_BUCKET_NAME_DEV       = { key = "R2_BUCKET_NAME", value = cloudflare_r2_bucket.dev.name, targets = ["development"], sensitive = false }
    PUBLIC_BASE_URL          = { key = "PUBLIC_BASE_URL", value = "https://${var.app_domain}", targets = ["production", "preview"], sensitive = false }
    PUBLIC_BASE_URL_DEV      = { key = "PUBLIC_BASE_URL", value = "http://${var.app_domain_dev}:5173", targets = ["development"], sensitive = false }
    GOOGLE_CLIENT_ID         = { key = "GOOGLE_CLIENT_ID", value = var.google_client_id, targets = ["production", "preview", "development"], sensitive = false }
    POCKETID_CLIENT_ID       = { key = "POCKETID_CLIENT_ID", value = var.pocketid_client_id, targets = ["production", "preview", "development"], sensitive = false }
    POCKETID_BASE_URL        = { key = "POCKETID_BASE_URL", value = var.pocketid_base_url, targets = ["production", "preview", "development"], sensitive = false }
    EMAIL_FROM               = { key = "EMAIL_FROM", value = var.email_from, targets = ["production", "preview", "development"], sensitive = false }
    PUBLIC_SENTRY_DSN        = { key = "PUBLIC_SENTRY_DSN", value = sentry_key.main.dsn["public"], targets = ["production", "preview", "development"], sensitive = false }
    PUBLIC_UMAMI_BASE_URL    = { key = "PUBLIC_UMAMI_BASE_URL", value = var.umami_base_url, targets = ["production", "preview", "development"], sensitive = false }
    PUBLIC_UMAMI_WEBSITE_ID  = { key = "PUBLIC_UMAMI_WEBSITE_ID", value = var.umami_website_id, targets = ["production", "preview", "development"], sensitive = false }
    PUBLIC_CAPTCHA_SITE_KEY  = { key = "PUBLIC_CAPTCHA_SITE_KEY", value = cloudflare_turnstile_widget.main.sitekey, targets = ["production", "preview", "development"], sensitive = false }
    LOG_LEVEL                = { key = "LOG_LEVEL", value = var.log_level, targets = ["production", "preview"], sensitive = false }
    LOG_LEVEL_DEV            = { key = "LOG_LEVEL", value = "debug", targets = ["development"], sensitive = false }
    NO_COLOR                 = { key = "NO_COLOR", value = var.no_color, targets = ["production", "preview"], sensitive = false }
    NO_COLOR_DEV             = { key = "NO_COLOR", value = "false", targets = ["development"], sensitive = false }
    DATABASE_URL             = { key = "DATABASE_URL", value = neon_project.main.connection_uri, targets = ["production"], sensitive = false }
    DATABASE_URL_PREVIEW     = { key = "DATABASE_URL", value = local.neon_urls["preview"], targets = ["preview"], sensitive = false }
    DATABASE_URL_DEV         = { key = "DATABASE_URL", value = local.neon_urls["dev"], targets = ["development"], sensitive = false }
    UPSTASH_REDIS_REST_URL   = { key = "UPSTASH_REDIS_REST_URL", value = "https://${upstash_redis_database.main.endpoint}", targets = ["production", "preview", "development"], sensitive = false }
    UPSTASH_REDIS_REST_TOKEN = { key = "UPSTASH_REDIS_REST_TOKEN", value = upstash_redis_database.main.rest_token, targets = ["production", "preview", "development"], sensitive = false }
    R2_ACCESS_KEY_ID         = { key = "R2_ACCESS_KEY_ID", value = module.r2_api_token_prod.id, targets = ["production", "preview"], sensitive = false }
    R2_SECRET_ACCESS_KEY     = { key = "R2_SECRET_ACCESS_KEY", value = module.r2_api_token_prod.secret, targets = ["production", "preview"], sensitive = false }
    R2_ACCESS_KEY_ID_DEV     = { key = "R2_ACCESS_KEY_ID", value = module.r2_api_token_dev.id, targets = ["development"], sensitive = false }
    R2_SECRET_ACCESS_KEY_DEV = { key = "R2_SECRET_ACCESS_KEY", value = module.r2_api_token_dev.secret, targets = ["development"], sensitive = false }
    BETTER_AUTH_SECRET       = { key = "BETTER_AUTH_SECRET", value = var.better_auth_secret, targets = ["production", "preview"], sensitive = false }
    BETTER_AUTH_SECRET_DEV   = { key = "BETTER_AUTH_SECRET", value = var.better_auth_secret_dev, targets = ["development"], sensitive = false }
    GOOGLE_CLIENT_SECRET     = { key = "GOOGLE_CLIENT_SECRET", value = var.google_client_secret, targets = ["production", "preview", "development"], sensitive = false }
    POCKETID_CLIENT_SECRET   = { key = "POCKETID_CLIENT_SECRET", value = var.pocketid_client_secret, targets = ["production", "preview", "development"], sensitive = false }
    RESEND_API_KEY           = { key = "RESEND_API_KEY", value = var.resend_api_key, targets = ["production", "preview", "development"], sensitive = false }
    CAPTCHA_SECRET_KEY       = { key = "CAPTCHA_SECRET_KEY", value = cloudflare_turnstile_widget.main.secret, targets = ["production", "preview", "development"], sensitive = false }
    PAYSTACK_SECRET_KEY      = { key = "PAYSTACK_SECRET_KEY", value = var.paystack_secret_key, targets = ["production", "preview"], sensitive = false }
    PAYSTACK_SECRET_KEY_DEV  = { key = "PAYSTACK_SECRET_KEY", value = var.paystack_secret_key_dev, targets = ["development"], sensitive = false }
    CLOUDINARY_API_KEY       = { key = "CLOUDINARY_API_KEY", value = var.cloudinary_api_key, targets = ["production", "preview", "development"], sensitive = false }
    CLOUDINARY_API_SECRET    = { key = "CLOUDINARY_API_SECRET", value = var.cloudinary_api_secret, targets = ["production", "preview", "development"], sensitive = false }
    CLOUDINARY_CLOUD_NAME    = { key = "CLOUDINARY_CLOUD_NAME", value = var.cloudinary_cloud_name, targets = ["production", "preview", "development"], sensitive = false }
    OPENAI_API_KEY           = { key = "OPENAI_API_KEY", value = var.openai_api_key, targets = ["production", "preview", "development"], sensitive = false }
    APP_ENV                  = { key = "APP_ENV", value = "production", targets = ["production"], sensitive = false }
    APP_ENV_PREVIEW          = { key = "APP_ENV", value = "preview", targets = ["preview"], sensitive = false }
    APP_ENV_DEV              = { key = "APP_ENV", value = "development", targets = ["development"], sensitive = false }
    CLOUDINARY_UPLOAD_PRESET = { key = "CLOUDINARY_UPLOAD_PRESET", value = var.cloudinary_upload_preset, targets = ["production", "preview", "development"], sensitive = false }
  }
}
