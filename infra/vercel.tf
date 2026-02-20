# ---------------------------------------------------------------------------
# Vercel project
# ---------------------------------------------------------------------------
resource "vercel_project" "app" {
  team_id   = var.vercel_team_id
  name      = var.project_name
  framework = "sveltekit"

  build_command    = "vite build && pnpm db:migrate"
  output_directory = ".vercel/output"

  resource_config = {
    function_default_regions = ["cpt1"]
  }

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

  # Compose the Neon connection string from provisioned resources
  database_url = neon_project.main.connection_uri

  dev_database_url = "postgresql://${neon_role.dev.name}:${neon_role.dev.password}@${neon_endpoint.dev.host}/${neon_database.dev.name}?sslmode=require"
}

# --- Infra-derived vars (different per environment is not needed here) ---

resource "vercel_project_environment_variable" "database_url" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "DATABASE_URL"
  value      = local.database_url
  target     = local.prod_only
  sensitive  = true
}

resource "vercel_project_environment_variable" "dev_database_url" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "DATABASE_URL"
  value      = local.dev_database_url
  target     = local.dev_only
  sensitive  = false
}

resource "vercel_project_environment_variable" "upstash_redis_rest_url" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "UPSTASH_REDIS_REST_URL"
  value      = "https://${upstash_redis_database.main.endpoint}"
  target     = local.all_envs
  sensitive  = false
}

resource "vercel_project_environment_variable" "upstash_redis_rest_token" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "UPSTASH_REDIS_REST_TOKEN"
  value      = upstash_redis_database.main.rest_token
  target     = local.all_envs
  sensitive  = false
}

resource "vercel_project_environment_variable" "cloudflare_account_id" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "CLOUDFLARE_ACCOUNT_ID"
  value      = var.cloudflare_account_id
  target     = local.all_envs
}

resource "vercel_project_environment_variable" "r2_bucket_name" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "R2_BUCKET_NAME"
  value      = cloudflare_r2_bucket.main.name
  target     = local.prod_only
}

resource "vercel_project_environment_variable" "r2_bucket_name_dev" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "R2_BUCKET_NAME"
  value      = cloudflare_r2_bucket.dev.name
  target     = local.dev_only
}

resource "vercel_project_environment_variable" "r2_access_key_id" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "R2_ACCESS_KEY_ID"
  value      = var.r2_access_key_id
  target     = local.prod_only
  sensitive  = true
}

resource "vercel_project_environment_variable" "r2_secret_access_key" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "R2_SECRET_ACCESS_KEY"
  value      = var.r2_secret_access_key
  target     = local.prod_only
  sensitive  = true
}

resource "vercel_project_environment_variable" "r2_access_key_id_dev" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "R2_ACCESS_KEY_ID"
  value      = var.r2_access_key_id_dev
  target     = local.dev_only
  sensitive  = false
}

resource "vercel_project_environment_variable" "r2_secret_access_key_dev" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "R2_SECRET_ACCESS_KEY"
  value      = var.r2_secret_access_key_dev
  target     = local.dev_only
  sensitive  = false
}

# --- URLs ---

resource "vercel_project_environment_variable" "public_base_url" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "PUBLIC_BASE_URL"
  value      = "https://${vercel_project.app.name}.vercel.app"
  target     = local.prod_only
}

resource "vercel_project_environment_variable" "public_base_url_dev" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "PUBLIC_BASE_URL"
  value      = "http://localhost:5173"
  target     = local.dev_only
}


# --- Auth ---

resource "vercel_project_environment_variable" "better_auth_secret" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "BETTER_AUTH_SECRET"
  value      = var.better_auth_secret
  target     = local.prod_only
  sensitive  = true
}

resource "vercel_project_environment_variable" "better_auth_secret_dev" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "BETTER_AUTH_SECRET"
  value      = var.better_auth_secret_dev
  target     = local.dev_only
  sensitive  = false
}

resource "vercel_project_environment_variable" "google_client_id" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "GOOGLE_CLIENT_ID"
  value      = var.google_client_id
  target     = local.all_envs
}

resource "vercel_project_environment_variable" "google_client_secret" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "GOOGLE_CLIENT_SECRET"
  value      = var.google_client_secret
  target     = local.all_envs
  sensitive  = false
}

resource "vercel_project_environment_variable" "pocketid_client_id" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "POCKETID_CLIENT_ID"
  value      = var.pocketid_client_id
  target     = local.all_envs
}

resource "vercel_project_environment_variable" "pocketid_client_secret" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "POCKETID_CLIENT_SECRET"
  value      = var.pocketid_client_secret
  target     = local.all_envs
  sensitive  = false
}

resource "vercel_project_environment_variable" "pocketid_base_url" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "POCKETID_BASE_URL"
  value      = var.pocketid_base_url
  target     = local.all_envs
}

# --- Email / SMTP ---

resource "vercel_project_environment_variable" "email_from" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "EMAIL_FROM"
  value      = var.email_from
  target     = local.all_envs
}

resource "vercel_project_environment_variable" "resend_api_key" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "RESEND_API_KEY"
  value      = var.resend_api_key
  target     = local.all_envs
  sensitive  = false
}

# --- Observability ---

resource "vercel_project_environment_variable" "sentry_dsn" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "PUBLIC_SENTRY_DSN"
  value      = var.sentry_dsn
  target     = local.all_envs
}

resource "vercel_project_environment_variable" "sentry_auth_token" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "SENTRY_AUTH_TOKEN"
  value      = var.sentry_auth_token
  target     = local.prod_only
  sensitive  = true
}

resource "vercel_project_environment_variable" "umami_base_url" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "PUBLIC_UMAMI_BASE_URL"
  value      = var.umami_base_url
  target     = local.all_envs
}

resource "vercel_project_environment_variable" "umami_website_id" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "PUBLIC_UMAMI_WEBSITE_ID"
  value      = var.umami_website_id
  target     = local.all_envs
}

# --- Captcha (Cloudflare Turnstile — created manually in CF dashboard) ---

resource "vercel_project_environment_variable" "captcha_secret_key" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "CAPTCHA_SECRET_KEY"
  value      = var.captcha_secret_key
  target     = local.all_envs
  sensitive  = false
}

resource "vercel_project_environment_variable" "captcha_site_key" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "PUBLIC_CAPTCHA_SITE_KEY"
  value      = var.captcha_site_key
  target     = local.all_envs
}

# --- Payments ---

resource "vercel_project_environment_variable" "paystack_secret_key" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "PAYSTACK_SECRET_KEY"
  value      = var.paystack_secret_key
  target     = local.prod_only
  sensitive  = true
}

resource "vercel_project_environment_variable" "paystack_secret_key_dev" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "PAYSTACK_SECRET_KEY"
  value      = var.paystack_secret_key_dev
  target     = local.dev_only
  sensitive  = false
}

# --- Logging ---

resource "vercel_project_environment_variable" "log_level" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "LOG_LEVEL"
  value      = var.log_level
  target     = local.all_envs
}

resource "vercel_project_environment_variable" "no_color" {
  project_id = vercel_project.app.id
  team_id    = var.vercel_team_id
  key        = "NO_COLOR"
  value      = var.no_color
  target     = local.all_envs
}


