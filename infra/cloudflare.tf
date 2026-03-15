resource "cloudflare_r2_bucket" "main" {
  account_id = var.cloudflare_account_id
  name       = "${var.project_name}-prod"

  # EEUR = Eastern Europe (best latency for EU-West workloads)
  location = "EEUR"
}

resource "cloudflare_r2_bucket" "dev" {
  account_id = var.cloudflare_account_id
  name       = "${var.project_name}-dev"

  # EEUR = Eastern Europe (best latency for EU-West workloads)
  location = "EEUR"
}

module "r2_api_token_prod" {
  source  = "Cyb3r-Jak3/r2-api-token/cloudflare"
  version = "6.0.0"

  account_id = var.cloudflare_account_id

  buckets      = [cloudflare_r2_bucket.main.name]
  bucket_read  = true
  bucket_write = true

  token_name = "r2-${var.project_name}-prod"
}

module "r2_api_token_dev" {
  source  = "Cyb3r-Jak3/r2-api-token/cloudflare"
  version = "6.0.0"

  account_id = var.cloudflare_account_id

  buckets      = [cloudflare_r2_bucket.dev.name]
  bucket_read  = true
  bucket_write = true

  token_name = "r2-${var.project_name}-dev"
}

resource "cloudflare_turnstile_widget" "main" {
  account_id = var.cloudflare_account_id
  mode       = "managed"
  name       = var.project_name
  domains = [
    var.app_domain,
    var.app_domain_dev,
  ]
}
