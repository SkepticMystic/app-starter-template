# ---------------------------------------------------------------------------
# Vercel, on the way out
# ---------------------------------------------------------------------------
#
# The project and its 38 environment variables have moved to
# infra/app_env.tf and infra/github.tf. What is left here is the safe way to
# stop managing them.
#
# DO NOT simply delete this file. A resource that disappears from the
# configuration is a resource OpenTofu plans to DESTROY — which would tear down
# the running Vercel project while it is still serving production and still the
# rollback target. `removed` with `destroy = false` tells OpenTofu to forget
# the resources instead: they leave state, and nothing happens to them.
#
# Sequence:
#
#   1. Apply the rest of this migration while the Vercel project keeps running.
#      Both stacks are live; the cutover is a DNS change and the rollback is
#      changing it back.
#   2. Once the box has been serving production long enough to trust — the
#      runbook says T+30 days — apply this file.
#   3. Then disconnect the Git integration in the Vercel dashboard so pushes
#      stop triggering builds, and delete the project by hand when ready.
#      Deleting it is deliberately NOT automated: while it exists, rollback is
#      a 60-second DNS flip.
#
# Step 2 is also when `vercel_api_token` and `vercel_team_id` can come out of
# variables.tf and terraform.tfvars.
#
# The provider is already gone from main.tf; `removed` blocks need no provider,
# because forgetting a resource requires no API call.

removed {
  from = vercel_project.app

  lifecycle {
    destroy = false
  }
}

# The environment variables, each forgotten rather than deleted. They live
# inside the project, which is itself being left alone.

removed {
  from = vercel_project_environment_variable.CLOUDFLARE_ACCOUNT_ID

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.R2_BUCKET_NAME

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.R2_BUCKET_NAME_DEV

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.PUBLIC_BASE_URL

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.PUBLIC_BASE_URL_DEV

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.GOOGLE_CLIENT_ID

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.POCKETID_CLIENT_ID

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.POCKETID_BASE_URL

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.EMAIL_FROM

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.PUBLIC_SENTRY_DSN

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.PUBLIC_UMAMI_BASE_URL

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.PUBLIC_UMAMI_WEBSITE_ID

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.PUBLIC_CAPTCHA_SITE_KEY

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.LOG_LEVEL

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.LOG_LEVEL_DEV

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.NO_COLOR

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.NO_COLOR_DEV

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.DATABASE_URL

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.DATABASE_URL_PREVIEW

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.DATABASE_URL_DEV

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.UPSTASH_REDIS_REST_URL

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.UPSTASH_REDIS_REST_TOKEN

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.R2_ACCESS_KEY_ID

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.R2_SECRET_ACCESS_KEY

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.R2_ACCESS_KEY_ID_DEV

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.R2_SECRET_ACCESS_KEY_DEV

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.BETTER_AUTH_SECRET

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.BETTER_AUTH_SECRET_DEV

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.GOOGLE_CLIENT_SECRET

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.POCKETID_CLIENT_SECRET

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.RESEND_API_KEY

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.CAPTCHA_SECRET_KEY

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.PAYSTACK_SECRET_KEY

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.PAYSTACK_SECRET_KEY_DEV

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.CLOUDINARY_API_KEY

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.CLOUDINARY_API_SECRET

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.CLOUDINARY_CLOUD_NAME

  lifecycle {
    destroy = false
  }
}

removed {
  from = vercel_project_environment_variable.OPENAI_API_KEY

  lifecycle {
    destroy = false
  }
}
