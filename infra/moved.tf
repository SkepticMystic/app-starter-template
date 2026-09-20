# ---------------------------------------------------------------------------
# State moves
# ---------------------------------------------------------------------------
#
# Moving a resource into a module changes its state address. Without these, a
# plain `tofu apply` DESTROYS and recreates every one of them — and recreating
# `vercel_project` means losing the project's domains, deployment history and
# git integration.
#
# Procedure:
#   1. cp terraform.tfstate terraform.tfstate.pre-module
#   2. tofu plan
#   3. REQUIRED outcome: zero destroys, and vercel_project.app shown as moved,
#      not replaced. If anything says "will be destroyed", stop and fix the
#      block — do not apply.
#   4. tofu apply
#   5. Delete this file in a follow-up commit; moves are consumed on apply.
#
# `module.vercel[0]` is indexed because the module uses `count`.

moved {
  from = vercel_project.app
  to   = module.vercel[0].vercel_project.app
}


moved {
  from = vercel_project_environment_variable.CLOUDFLARE_ACCOUNT_ID
  to   = module.vercel[0].vercel_project_environment_variable.env["CLOUDFLARE_ACCOUNT_ID"]
}

moved {
  from = vercel_project_environment_variable.R2_BUCKET_NAME
  to   = module.vercel[0].vercel_project_environment_variable.env["R2_BUCKET_NAME"]
}

moved {
  from = vercel_project_environment_variable.R2_BUCKET_NAME_DEV
  to   = module.vercel[0].vercel_project_environment_variable.env["R2_BUCKET_NAME_DEV"]
}

moved {
  from = vercel_project_environment_variable.PUBLIC_BASE_URL
  to   = module.vercel[0].vercel_project_environment_variable.env["PUBLIC_BASE_URL"]
}

moved {
  from = vercel_project_environment_variable.PUBLIC_BASE_URL_DEV
  to   = module.vercel[0].vercel_project_environment_variable.env["PUBLIC_BASE_URL_DEV"]
}

moved {
  from = vercel_project_environment_variable.GOOGLE_CLIENT_ID
  to   = module.vercel[0].vercel_project_environment_variable.env["GOOGLE_CLIENT_ID"]
}

moved {
  from = vercel_project_environment_variable.POCKETID_CLIENT_ID
  to   = module.vercel[0].vercel_project_environment_variable.env["POCKETID_CLIENT_ID"]
}

moved {
  from = vercel_project_environment_variable.POCKETID_BASE_URL
  to   = module.vercel[0].vercel_project_environment_variable.env["POCKETID_BASE_URL"]
}

moved {
  from = vercel_project_environment_variable.EMAIL_FROM
  to   = module.vercel[0].vercel_project_environment_variable.env["EMAIL_FROM"]
}

moved {
  from = vercel_project_environment_variable.PUBLIC_SENTRY_DSN
  to   = module.vercel[0].vercel_project_environment_variable.env["PUBLIC_SENTRY_DSN"]
}

moved {
  from = vercel_project_environment_variable.PUBLIC_UMAMI_BASE_URL
  to   = module.vercel[0].vercel_project_environment_variable.env["PUBLIC_UMAMI_BASE_URL"]
}

moved {
  from = vercel_project_environment_variable.PUBLIC_UMAMI_WEBSITE_ID
  to   = module.vercel[0].vercel_project_environment_variable.env["PUBLIC_UMAMI_WEBSITE_ID"]
}

moved {
  from = vercel_project_environment_variable.PUBLIC_CAPTCHA_SITE_KEY
  to   = module.vercel[0].vercel_project_environment_variable.env["PUBLIC_CAPTCHA_SITE_KEY"]
}

moved {
  from = vercel_project_environment_variable.LOG_LEVEL
  to   = module.vercel[0].vercel_project_environment_variable.env["LOG_LEVEL"]
}

moved {
  from = vercel_project_environment_variable.LOG_LEVEL_DEV
  to   = module.vercel[0].vercel_project_environment_variable.env["LOG_LEVEL_DEV"]
}

moved {
  from = vercel_project_environment_variable.NO_COLOR
  to   = module.vercel[0].vercel_project_environment_variable.env["NO_COLOR"]
}

moved {
  from = vercel_project_environment_variable.NO_COLOR_DEV
  to   = module.vercel[0].vercel_project_environment_variable.env["NO_COLOR_DEV"]
}

moved {
  from = vercel_project_environment_variable.DATABASE_URL
  to   = module.vercel[0].vercel_project_environment_variable.env["DATABASE_URL"]
}

moved {
  from = vercel_project_environment_variable.DATABASE_URL_PREVIEW
  to   = module.vercel[0].vercel_project_environment_variable.env["DATABASE_URL_PREVIEW"]
}

moved {
  from = vercel_project_environment_variable.DATABASE_URL_DEV
  to   = module.vercel[0].vercel_project_environment_variable.env["DATABASE_URL_DEV"]
}

moved {
  from = vercel_project_environment_variable.UPSTASH_REDIS_REST_URL
  to   = module.vercel[0].vercel_project_environment_variable.env["UPSTASH_REDIS_REST_URL"]
}

moved {
  from = vercel_project_environment_variable.UPSTASH_REDIS_REST_TOKEN
  to   = module.vercel[0].vercel_project_environment_variable.env["UPSTASH_REDIS_REST_TOKEN"]
}

moved {
  from = vercel_project_environment_variable.R2_ACCESS_KEY_ID
  to   = module.vercel[0].vercel_project_environment_variable.env["R2_ACCESS_KEY_ID"]
}

moved {
  from = vercel_project_environment_variable.R2_SECRET_ACCESS_KEY
  to   = module.vercel[0].vercel_project_environment_variable.env["R2_SECRET_ACCESS_KEY"]
}

moved {
  from = vercel_project_environment_variable.R2_ACCESS_KEY_ID_DEV
  to   = module.vercel[0].vercel_project_environment_variable.env["R2_ACCESS_KEY_ID_DEV"]
}

moved {
  from = vercel_project_environment_variable.R2_SECRET_ACCESS_KEY_DEV
  to   = module.vercel[0].vercel_project_environment_variable.env["R2_SECRET_ACCESS_KEY_DEV"]
}

moved {
  from = vercel_project_environment_variable.BETTER_AUTH_SECRET
  to   = module.vercel[0].vercel_project_environment_variable.env["BETTER_AUTH_SECRET"]
}

moved {
  from = vercel_project_environment_variable.BETTER_AUTH_SECRET_DEV
  to   = module.vercel[0].vercel_project_environment_variable.env["BETTER_AUTH_SECRET_DEV"]
}

moved {
  from = vercel_project_environment_variable.GOOGLE_CLIENT_SECRET
  to   = module.vercel[0].vercel_project_environment_variable.env["GOOGLE_CLIENT_SECRET"]
}

moved {
  from = vercel_project_environment_variable.POCKETID_CLIENT_SECRET
  to   = module.vercel[0].vercel_project_environment_variable.env["POCKETID_CLIENT_SECRET"]
}

moved {
  from = vercel_project_environment_variable.RESEND_API_KEY
  to   = module.vercel[0].vercel_project_environment_variable.env["RESEND_API_KEY"]
}

moved {
  from = vercel_project_environment_variable.CAPTCHA_SECRET_KEY
  to   = module.vercel[0].vercel_project_environment_variable.env["CAPTCHA_SECRET_KEY"]
}

moved {
  from = vercel_project_environment_variable.PAYSTACK_SECRET_KEY
  to   = module.vercel[0].vercel_project_environment_variable.env["PAYSTACK_SECRET_KEY"]
}

moved {
  from = vercel_project_environment_variable.PAYSTACK_SECRET_KEY_DEV
  to   = module.vercel[0].vercel_project_environment_variable.env["PAYSTACK_SECRET_KEY_DEV"]
}

moved {
  from = vercel_project_environment_variable.CLOUDINARY_API_KEY
  to   = module.vercel[0].vercel_project_environment_variable.env["CLOUDINARY_API_KEY"]
}

moved {
  from = vercel_project_environment_variable.CLOUDINARY_API_SECRET
  to   = module.vercel[0].vercel_project_environment_variable.env["CLOUDINARY_API_SECRET"]
}

moved {
  from = vercel_project_environment_variable.CLOUDINARY_CLOUD_NAME
  to   = module.vercel[0].vercel_project_environment_variable.env["CLOUDINARY_CLOUD_NAME"]
}

moved {
  from = vercel_project_environment_variable.OPENAI_API_KEY
  to   = module.vercel[0].vercel_project_environment_variable.env["OPENAI_API_KEY"]
}
