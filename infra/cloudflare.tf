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


# data "cloudflare_api_token_permission_groups" "all" {}

# resource "cloudflare_api_token" "r2_prod" {
#   name       = "${var.project_name}-r2-prod"

#   policies = [
#     {
#       effect = "allow"
#       permission_groups = [
#         data.cloudflare_api_token_permission_groups.all.r2["Workers R2 Storage Bucket Item Read"],
#         data.cloudflare_api_token_permission_groups.all.r2["Workers R2 Storage Bucket Item Write"],
#       ]
#       resources = {
#         "com.cloudflare.edge.r2.bucket.${var.cloudflare_account_id}_default_${cloudflare_r2_bucket.main.name}" = "*"
#       }
#     }
#   ]
# }

# resource "cloudflare_api_token" "r2_dev" {
#   name       = "${var.project_name}-r2-dev"

#   policies = [
#     {
#       effect = "allow"
#       permission_groups = [
#         data.cloudflare_api_token_permission_groups.all.r2["Workers R2 Storage Bucket Item Read"],
#         data.cloudflare_api_token_permission_groups.all.r2["Workers R2 Storage Bucket Item Write"],
#       ]
#       resources = {
#         "com.cloudflare.edge.r2.bucket.${var.cloudflare_account_id}_default_${cloudflare_r2_bucket.dev.name}" = "*"
#       }
#     }
#   ]
# }

resource "cloudflare_turnstile_widget" "main" {
  account_id = var.cloudflare_account_id
  domains    = var.turnstile_domains
  mode       = "managed"
  name       = var.project_name
}
