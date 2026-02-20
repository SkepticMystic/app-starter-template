# ---------------------------------------------------------------------------
# Provider credentials
# ---------------------------------------------------------------------------

variable "neon_api_key" {
  description = "Neon API key. Generate at https://console.neon.tech/app/settings/api-keys"
  type        = string
  sensitive   = true
}

variable "neon_org_id" {
  description = "Neon organization ID. Find at https://console.neon.tech/app/settings/organization"
  type        = string
}

variable "upstash_email" {
  description = "Email address associated with your Upstash account"
  type        = string
}

variable "upstash_api_key" {
  description = "Upstash API key. Generate at https://console.upstash.com/account/api"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with R2:Edit and Zone:Read permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID (visible in the dashboard URL or right sidebar)"
  type        = string
}

variable "vercel_api_token" {
  description = "Vercel API token. Generate at https://vercel.com/account/tokens"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel team ID (e.g. team_xxxx). Found in team settings."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository in owner/repo format (e.g. acme/my-app)"
  type        = string
}

# ---------------------------------------------------------------------------
# Project config
# ---------------------------------------------------------------------------

variable "project_name" {
  description = "Name of the project, used across Neon, Upstash, and Cloudflare resources"
  type        = string
  default     = "app-starter-template"
}

variable "neon_region" {
  description = "Neon region for the primary database. See https://neon.tech/docs/introduction/regions"
  type        = string
  default     = "aws-eu-west-2"
}

variable "upstash_region" {
  description = "Upstash region for the Redis database. See https://upstash.com/docs/redis/overall/regions"
  type        = string
  default     = "eu-west-1"
}

variable "r2_access_key_id" {
  description = "Cloudflare R2 API token access key ID. Create under R2 > Manage API tokens in the Cloudflare dashboard."
  type        = string
  sensitive   = true
}

variable "r2_secret_access_key" {
  description = "Cloudflare R2 API token secret access key"
  type        = string
  sensitive   = true
}

variable "r2_access_key_id_dev" {
  description = "Cloudflare R2 API token access key ID for local development. Create under R2 > Manage API tokens in the Cloudflare dashboard."
  type        = string
  sensitive   = true
}

variable "r2_secret_access_key_dev" {
  description = "Cloudflare R2 API token secret access key for local development"
  type        = string
  sensitive   = true
}

# ---------------------------------------------------------------------------
# App secrets — passed through to Vercel environment variables
# ---------------------------------------------------------------------------

variable "better_auth_secret" {
  description = "Secret key for Better-Auth session signing (min 32 chars, generate with: openssl rand -hex 32)"
  type        = string
  sensitive   = true
}

variable "better_auth_secret_dev" {
  description = "Secret key for Better-Auth session signing (min 32 chars, generate with: openssl rand -hex 32) for local development"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "pocketid_client_id" {
  description = "Pocket ID OAuth client ID"
  type        = string
  default     = ""
}

variable "pocketid_client_secret" {
  description = "Pocket ID OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "pocketid_base_url" {
  description = "Base URL of your Pocket ID instance (e.g. https://pocketid.example.com)"
  type        = string
  default     = ""
}

variable "email_from" {
  description = "From address used for outbound emails (e.g. hello@example.com)"
  type        = string
  default     = ""
}

variable "resend_api_key" {
  description = "Resend API key for transactional email. Get one at https://resend.com"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sentry_org_slug" {
  description = "Sentry organization slug"
  type        = string
  default     = ""
}

variable "sentry_team_slug" {
  description = "Sentry team slug"
  type        = string
  default     = ""
}

variable "sentry_integration_token" {
  description = "Sentry integration token so that OpenTofu can create a new project"
  type        = string
  sensitive   = true
  default     = ""
}

variable "umami_base_url" {
  description = "Base URL of your Umami analytics instance (e.g. https://eu.umami.is)"
  type        = string
  default     = ""
}

variable "umami_website_id" {
  description = "Umami website ID (UUID from Umami dashboard)"
  type        = string
  default     = ""
}

variable "captcha_secret_key" {
  description = "Cloudflare Turnstile secret key. Create a widget at https://dash.cloudflare.com/?to=/:account/turnstile"
  type        = string
  sensitive   = true
  default     = ""
}

variable "captcha_site_key" {
  description = "Cloudflare Turnstile site key (public, safe to expose)"
  type        = string
  default     = ""
}

variable "paystack_secret_key" {
  description = "Paystack secret key for payment processing"
  type        = string
  sensitive   = true
  default     = ""
}

variable "paystack_secret_key_dev" {
  description = "Paystack secret key for payment processing for local development"
  type        = string
  sensitive   = true
  default     = ""
}

variable "log_level" {
  description = "Application log level (trace | debug | info | warn | error | fatal)"
  type        = string
  default     = "info"

  validation {
    condition     = contains(["trace", "debug", "info", "warn", "error", "fatal"], var.log_level)
    error_message = "log_level must be one of: trace, debug, info, warn, error, fatal"
  }
}

variable "no_color" {
  description = "Disable color in logs"
  type        = string
  default     = "false"
}