terraform {
  required_version = ">= 1.8"

  required_providers {
    neon = {
      source = "kislerdm/neon"
      # Three components, deliberately. `~>` lets the RIGHTMOST specified
      # component increment, so `~> 0.13` allows 0.14 and 0.15 — it does not
      # pin the 0.13 line at all. For a pre-1.0 provider, where a minor bump is
      # a breaking change, the patch component is required.
      #
      # Not hypothetical: this was `~> 0.13` while .terraform.lock.hcl had
      # already resolved 0.13.0, and nothing would have stopped it moving.
      version = "~> 0.13.0"
    }
    upstash = {
      source  = "upstash/upstash"
      version = "~> 2.1"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.17"
    }
    sentry = {
      source  = "jianyuan/sentry"
      version = "0.14.9"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 4.6"
    }
  }
}

provider "neon" {
  api_key = var.neon_api_key
}

provider "upstash" {
  email   = var.upstash_email
  api_key = var.upstash_api_key
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "sentry" {
  token = var.sentry_integration_token
}

provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}
