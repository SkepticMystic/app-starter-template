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

# ---------------------------------------------------------------------------
# Provider credentials
#
# Every provider token comes from the environment, so none is in a variable,
# terraform.tfvars, or the plan output. (A variable or data source would also
# persist it into terraform.tfstate.) Export them before `tofu plan`/`apply`:
#
#   neon        NEON_API_KEY
#   upstash     UPSTASH_EMAIL, UPSTASH_API_KEY
#   cloudflare  CLOUDFLARE_API_TOKEN (R2:Edit, Turnstile:Edit, Zone:Read)
#   sentry      SENTRY_AUTH_TOKEN — the integration token that may create
#               projects, NOT the source-map token in var.sentry_auth_token.
#               An unrelated SENTRY_AUTH_TOKEN in your shell (sentry-cli reads
#               the same name) would be picked up here instead.
#   vercel      VERCEL_API_TOKEN
#
# The Vercel team is not a credential and the provider reads it from no
# variable, so it stays `var.vercel_team_id`.
# ---------------------------------------------------------------------------

provider "neon" {}

provider "upstash" {}

provider "cloudflare" {}

provider "sentry" {}

provider "vercel" {
  team = var.vercel_team_id
}
