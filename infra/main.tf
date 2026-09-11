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
    # Writes the per-tier environment blobs and the deploy key as repository
    # secrets. This is what preserves the property AGENTS.md insists on —
    # OpenTofu is the sole writer of environment configuration — now that the
    # Vercel project is no longer the consumer. See infra/app_env.tf.
    github = {
      source  = "integrations/github"
      version = "~> 6.6"
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

provider "github" {
  token = var.github_token
  owner = split("/", var.github_repo)[0]
}
