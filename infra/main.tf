terraform {
  required_version = ">= 1.8"

  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.13"
    }
    upstash = {
      source  = "upstash/upstash"
      version = "~> 2.1"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.17"
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

provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}
