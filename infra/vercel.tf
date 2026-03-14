# ---------------------------------------------------------------------------
# Vercel project
# ---------------------------------------------------------------------------
resource "vercel_project" "app" {
  team_id   = var.vercel_team_id
  name      = var.project_name
  framework = "sveltekit"

  build_command    = "pnpm build && pnpm db:migrate"
  output_directory = ".vercel/output"

  resource_config = {
    function_default_regions = ["cpt1"]
  }

  automatically_expose_system_environment_variables = true

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = "main"
  }
}

# ---------------------------------------------------------------------------
# Environment variables
#
# Sensitive vars are encrypted at rest in Vercel.
# They are also stored in terraform.tfstate — keep that file secure.
# ---------------------------------------------------------------------------

locals {
  # Environments to apply each variable to
  all_envs  = toset(["production", "preview", "development"])
  prod_only = toset(["production", "preview"])
  dev_only  = toset(["development"])
}

# --- Infra-derived vars (different per environment is not needed here) ---

resource "vercel_project_environment_variables" "main" {
  team_id    = var.vercel_team_id
  project_id = vercel_project.app.id

  variables = [
    {
      key    = "CLOUDFLARE_ACCOUNT_ID"
      value  = var.cloudflare_account_id
      target = local.all_envs
    },
    {
      key    = "R2_BUCKET_NAME"
      value  = cloudflare_r2_bucket.main.name
      target = local.prod_only
    },
    {
      key    = "R2_BUCKET_NAME"
      value  = cloudflare_r2_bucket.dev.name
      target = local.dev_only
    },
    {
      key    = "PUBLIC_BASE_URL"
      value  = var.app_url
      target = local.prod_only
    },
    {
      key    = "PUBLIC_BASE_URL"
      value  = var.app_url_dev
      target = local.dev_only
    },
    {
      key    = "GOOGLE_CLIENT_ID"
      value  = var.google_client_id
      target = local.all_envs
    },
    {
      key    = "POCKETID_CLIENT_ID"
      value  = var.pocketid_client_id
      target = local.all_envs
    },
    {
      key    = "POCKETID_BASE_URL"
      value  = var.pocketid_base_url
      target = local.all_envs
    },
    {
      key    = "EMAIL_FROM"
      value  = var.email_from
      target = local.all_envs
    },
    {
      key    = "PUBLIC_SENTRY_DSN"
      value  = sentry_key.main.dsn["public"]
      target = local.all_envs
    },
    {
      key    = "PUBLIC_UMAMI_BASE_URL"
      value  = var.umami_base_url
      target = local.all_envs
    },
    {
      key    = "PUBLIC_UMAMI_WEBSITE_ID"
      value  = var.umami_website_id
      target = local.all_envs
    },
    {
      key    = "PUBLIC_CAPTCHA_SITE_KEY"
      value  = cloudflare_turnstile_widget.main.sitekey
      target = local.all_envs
    },
    {
      key    = "LOG_LEVEL"
      value  = var.log_level
      target = local.prod_only
    },
    {
      key    = "LOG_LEVEL"
      value  = "debug"
      target = local.dev_only
    },
    {
      key    = "NO_COLOR"
      value  = var.no_color
      target = local.prod_only
    },
    {
      key    = "NO_COLOR"
      value  = "false"
      target = local.dev_only
    },
    {
      key    = "DATABASE_URL"
      value  = neon_project.main.connection_uri
      target = local.prod_only
      # sensitive = true
      sensitive = false
    },
    {
      key       = "DATABASE_URL"
      value     = "postgresql://${neon_role.dev.name}:${neon_role.dev.password}@${neon_endpoint.dev.host}/${neon_database.dev.name}?sslmode=require"
      target    = local.dev_only
      sensitive = false
    },
    {
      key       = "UPSTASH_REDIS_REST_URL"
      value     = "https://${upstash_redis_database.main.endpoint}"
      target    = local.all_envs
      sensitive = false
    },
    {
      key       = "UPSTASH_REDIS_REST_TOKEN"
      value     = upstash_redis_database.main.rest_token
      target    = local.all_envs
      sensitive = false
    },
    {
      key    = "R2_ACCESS_KEY_ID"
      value  = module.r2_api_token_prod.id
      target = local.prod_only
      # sensitive = true
      sensitive = false
    },
    {
      key    = "R2_SECRET_ACCESS_KEY"
      value  = module.r2_api_token_prod.secret
      target = local.prod_only
      # sensitive = true
      sensitive = false
    },
    {
      key       = "R2_ACCESS_KEY_ID"
      value     = module.r2_api_token_dev.id
      target    = local.dev_only
      sensitive = false
    },
    {
      key       = "R2_SECRET_ACCESS_KEY"
      value     = module.r2_api_token_dev.secret
      target    = local.dev_only
      sensitive = false
    },
    {
      key    = "BETTER_AUTH_SECRET"
      value  = var.better_auth_secret
      target = local.prod_only
      # sensitive = true
      sensitive = false
    },
    {
      key       = "BETTER_AUTH_SECRET"
      value     = var.better_auth_secret_dev
      target    = local.dev_only
      sensitive = false
    },
    {
      key       = "GOOGLE_CLIENT_SECRET"
      value     = var.google_client_secret
      target    = local.all_envs
      sensitive = false
    },
    {
      key       = "POCKETID_CLIENT_SECRET"
      value     = var.pocketid_client_secret
      target    = local.all_envs
      sensitive = false
    },
    {
      key       = "RESEND_API_KEY"
      value     = var.resend_api_key
      target    = local.all_envs
      sensitive = false
    },
    {
      key       = "CAPTCHA_SECRET_KEY"
      value     = cloudflare_turnstile_widget.main.secret
      target    = local.all_envs
      sensitive = false
    },
    {
      key    = "PAYSTACK_SECRET_KEY"
      value  = var.paystack_secret_key
      target = local.prod_only
      # sensitive = true
      sensitive = false
    },
    {
      key       = "PAYSTACK_SECRET_KEY"
      value     = var.paystack_secret_key_dev
      target    = local.dev_only
      sensitive = false
    },

    # --- Image hosting ---
    {
      key       = "CLOUDINARY_API_KEY"
      value     = var.cloudinary_api_key
      target    = local.all_envs
      sensitive = false
    },
    {
      key       = "CLOUDINARY_API_SECRET"
      value     = var.cloudinary_api_secret
      target    = local.all_envs
      sensitive = false
    },
    {
      key       = "CLOUDINARY_CLOUD_NAME"
      value     = var.cloudinary_cloud_name
      target    = local.all_envs
      sensitive = false
    },
    {
      key       = "CLOUDINARY_UPLOAD_PRESET"
      value     = var.cloudinary_upload_preset
      target    = local.all_envs
      sensitive = false
    },
    {
      key    = "OPENAI_API_KEY"
      value  = var.openai_api_key
      target = local.all_envs
      # sensitive = true
      sensitive = false
    },
  ]
}
