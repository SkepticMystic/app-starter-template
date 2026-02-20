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

# Enables the public *.r2.dev subdomain for the bucket.
# Note: public access is off by default; this just provisions the domain.
# resource "cloudflare_r2_managed_domain" "main" {
#   account_id  = var.cloudflare_account_id
#   bucket_name = cloudflare_r2_bucket.main.name
#   enabled     = true
# }

resource "cloudflare_turnstile_widget" "main" {
  account_id = var.cloudflare_account_id
  domains    = ["localhost"]
  mode       = "managed"
  name       = var.project_name
}
