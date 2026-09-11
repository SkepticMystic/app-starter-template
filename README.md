# App Starter Template

## Features

- SvelteKit, TypeScript
- shadcn-svelte
- Vite+ (`vp`) — build, test, lint and format in one toolchain
- Better-Auth
- Drizzle, Redis
- Docker + Caddy on a VPS, provisioned with OpenTofu

## Usage

### Local Development

1. Clone the repository

   ```bash
   git clone https://github.com/SkepticMystic/app-starter-template.git
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Set up environment variables

   Create a `.env` file in the root directory and add the necessary environment variables. You can refer to the `.env.example` file for guidance.

   Part of this step is setting up a new postgres db (I currently use neon). Create a development branch in the neon dashboard, and copy the connection string to your .env file as `DATABASE_URL`.

   Then run the following command to create the necessary tables:

   ```bash
   pnpm db:push
   ```

4. Run the development server

   ```bash
   pnpm dev
   ```

5. Open your browser and navigate to `http://localhost:5173` to see the app in action.

### Deployment

The app runs as a long-lived Node process (`adapter-node`) in Docker on a VPS,
behind Caddy, with Cloudflare in front. Neon, Upstash, R2, Cloudinary, Resend
and Sentry stay as managed services.

1. `tofu apply` in `infra/`. This provisions the managed services and writes
   each tier's environment as a GitHub Actions secret. **OpenTofu is the sole
   writer of environment configuration** — anything edited by hand on the box
   is overwritten by the next deploy.
2. Push to `main`. `.github/workflows/deploy.yml` runs `pnpm verify`, builds
   one image, boots it to prove it starts, deploys it to staging, and then
   blocks on approval of the `production` GitHub Environment.
3. On approval it migrates production and rolls the new image in blue/green.
   Caddy holds both colours as upstreams and moves traffic when the new one
   passes its health check, so no reload is involved and no request is dropped.

Useful paths:

| Path                    | What it is                                                            |
| ----------------------- | --------------------------------------------------------------------- |
| `Dockerfile`            | Multi-stage build. Debian, not Alpine — the native bindings are glibc |
| `deploy/compose.yaml`   | App (blue/green) + Caddy                                              |
| `deploy/Caddyfile`      | TLS, and the one place client-IP trust is computed                    |
| `deploy/deploy.sh`      | Migrate, start the idle colour, switch, stop the old one              |
| `deploy/rollback.sh`    | Previous image back in. **Code only — see below**                     |
| `deploy/env.required`   | Refuse to start without these                                         |
| `scripts/db/migrate.ts` | Run once per deploy, from the image being deployed                    |
| `src/env.ts`            | Every environment variable, validated at boot                         |

#### Rollback

`deploy/rollback.sh <tier>` puts the previous image back in about 30 seconds.

**It rolls back code only.** drizzle generates no down migrations, so every
schema change must be backward-compatible with the previous image
(expand/contract). This is the one place operational burden genuinely increased
by leaving Vercel.

#### Runbook notes

- `ORIGIN` must equal `PUBLIC_BASE_URL`. A mismatch rejects every form POST via
  SvelteKit's CSRF check while pages still render perfectly, so the app asserts
  it at boot rather than letting you find out from a support ticket.
- `BODY_SIZE_LIMIT` must stay above the app's own 5 MiB image limit, or uploads
  fail with adapter-node's raw 413 instead of the friendly error.
- The Cloudflare zone must be on **Full (strict)** SSL. On "Flexible" every
  request 526s against the Origin CA certificate.
- Add a Cloudflare cache rule for `/_app/immutable/*` (1 year). Those filenames
  are content-hashed, and it is most of what Vercel's CDN was doing.
- Watch disk. `deploy/compose.yaml` rotates container logs for this reason; a
  full disk takes Caddy, sshd and the database connections with it.

## Infrastructure

Cloud resources are managed with [OpenTofu](https://opentofu.org/) in the `infra/` directory.

Resources managed:

| Service                              | Provider                | What's provisioned                              |
| ------------------------------------ | ----------------------- | ----------------------------------------------- |
| [Neon](https://neon.tech)            | `kislerdm/neon`         | Project, production branch, database, app role  |
| [Upstash](https://upstash.com)       | `upstash/upstash`       | Redis database                                  |
| [Cloudflare](https://cloudflare.com) | `cloudflare/cloudflare` | R2 buckets, Turnstile widget                    |
| [Sentry](https://sentry.io)          | `jianyuan/sentry`       | Project and DSN                                 |
| [GitHub](https://github.com)         | `integrations/github`   | Per-tier env blobs, deploy key, build variables |

**Note:**

- The Cloudflare Turnstile widget **is** created by OpenTofu
  (`infra/cloudflare.tf`); its site key and secret flow straight into each
  tier's environment, so there is nothing to paste by hand.
- Put the VPS near the **database**, not near your users. A page render makes
  several sequential database round trips but only one user round trip, and
  Cloudflare terminates the user's TLS at its own edge. Neon's region is fixed
  at project creation, so decide before the first apply.
- Upstash is one shared instance separated only by a key prefix. Changing its
  `primary_region` forces replacement, which would destroy the data of every
  other project using it.

### Prerequisites

- [OpenTofu](https://opentofu.org/docs/intro/install/) >= 1.8
- API credentials for Neon, Upstash, Cloudflare, Sentry and GitHub
- A VPS with Docker, reachable over SSH as a `deploy` user

### First-time setup

```bash
# 1. Fill in credentials
cp infra/terraform.tfvars.example infra/terraform.tfvars
# edit infra/terraform.tfvars with your real values

# 2. Initialise providers
cd infra && tofu init

# 3. Review the plan
tofu plan

# 4. Apply
tofu apply

# 5. Write a local .env for development
#
# There is no `vercel env pull` any more. Development runs against the Neon
# `dev` branch and the dev bucket; `tofu output` gives you the non-secret
# values, and the secrets come from terraform.tfvars.
#
# APP_ENV is required and replaces VERCEL_ENV:
echo 'APP_ENV=development' >> .env.local

# 6. Migrate database
pnpm db:push
```

### State

State is stored locally in `infra/terraform.tfstate` (git-ignored). It contains
plaintext secrets — database passwords, the Better-Auth secret, R2 keys — so
treat the file as a credential in its own right.

Move it to a [remote backend](https://opentofu.org/docs/language/settings/backends/)
before a second person touches this. R2 works and you already pay for it:

```hcl
terraform {
  backend "s3" {
    bucket = "app-starter-tfstate"
    key    = "infra.tfstate"
    region = "auto"

    endpoints = { s3 = "https://<account>.r2.cloudflarestorage.com" }

    # R2 is S3-compatible but is not S3.
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true

    # Conditional-write locking; no DynamoDB table needed.
    use_lockfile = true
  }
}
```

After `tofu init -migrate-state`, shred the local file and rotate everything
that was in it. It has sat unencrypted on a laptop, and you cannot know it was
never backed up somewhere.

## TODOs

- [ ] PWA on app store: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable#installation_from_an_app_store
- [ ] Zero sync?
- [ ] Proper site.manifest and favicons: https://realfavicongenerator.net
- [ ] https://github.com/LukasNiessen/ArchUnitTS
- [ ] Contact form from animal-shelter
- [ ] Client.form submit wrapper to handle toast, form.reset(), etc
- [ ] Paystack-Better-Auth
- [ ] Paraglide
