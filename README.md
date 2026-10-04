# App Starter Template

## Features

- SvelteKit, TypeScript
- shadcn-svelte
- Oxlint, Oxfmt (via Vite+)
- Better-Auth
- Drizzle, Redis
- Deploys to Vercel, or to any Node host / Docker

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

Vercel is the default target. Nothing in `src/` reads a `VERCEL_*` variable, so
the same code also runs as a standalone Node server — `vite.config.ts` picks
`adapter-vercel` or `adapter-node` based on whether `VERCEL` is set in the build
environment.

#### Vercel

1. Push your code to a Git repository (e.g., GitHub, GitLab).
2. Connect your repository to Vercel.
3. Run `tofu apply` in `infra/`. **Environment variables and the build command
   are managed by OpenTofu, not the dashboard** — anything set by hand there is
   overwritten on the next apply.

#### Docker / any Node host

```bash
docker build \
  --build-arg PUBLIC_BASE_URL=https://your.domain \
  --build-arg APP_ENV=production \
  --build-arg SENTRY_RELEASE="$(git rev-parse HEAD)" \
  --secret id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN \
  -t app .

# Migrations are a separate one-shot step, never the entrypoint: replicas
# starting together would race, and neon-http has no transactions to lock with.
# The runtime image has no pnpm; this is what `pnpm db:migrate:run` runs.
docker run --rm --env-file .env app node scripts/db/migrate.script.ts

# Over SHUTDOWN_TIMEOUT (20s) plus the 30s background-work drain.
docker run -p 3000:3000 --stop-timeout 60 --env-file .env app
```

The Sentry secret is optional: without it the build skips the source-map
upload. To check the production image locally against your `.env`, run
`docker compose up --build` (it waits on `/api/health`), and
`docker compose run --rm migrate` for the migration step.

> **`--env-file` and quotes.** Docker does not strip quotes from an env file —
> `FOO="bar"` becomes the six-character value `"bar"`. `.env.example` is
> unquoted for that reason, but a `.env` from `vercel env pull` is quoted, so
> strip them first:
>
> ```bash
> sed -E 's/^([A-Z0-9_]+)="(.*)"$/\1=\2/' .env > .env.docker
> ```

Only `APP_ENV` and the `PUBLIC_*` variables are build args — they are compiled
in. Every secret is read at runtime, so none of them end up in an image layer.
`PUBLIC_BASE_URL` doubles as the origin SvelteKit trusts for CSRF checks, so an
image is built for one origin. See the Deployment section of `AGENTS.md` for the
`adapter-node` runtime variables (`ADDRESS_HEADER`, `XFF_DEPTH`,
`BODY_SIZE_LIMIT`) and why each one matters.

## Infrastructure

Cloud resources are managed with [OpenTofu](https://opentofu.org/) in the `infra/` directory.

Resources managed:

| Service                              | Provider                | What's provisioned                             |
| ------------------------------------ | ----------------------- | ---------------------------------------------- |
| [Neon](https://neon.tech)            | `kislerdm/neon`         | Project, production branch, database, app role |
| [Upstash](https://upstash.com)       | `upstash/upstash`       | Redis database                                 |
| [Cloudflare](https://cloudflare.com) | `cloudflare/cloudflare` | R2 bucket                                      |
| [Vercel](https://vercel.com)         | `vercel/vercel`         | Project config + all environment variables     |

The Vercel resources sit behind `deploy_vercel` (default `true`) in
`infra/modules/vercel`. Set it to `false` to provision only the shared services
for a container deploy; the environment manifest itself lives in
`infra/app_env.tf` and is target-agnostic.

**Note:**

- Cloudflare Turnstile widgets are provisioned by OpenTofu
  (`cloudflare_turnstile_widget.main` in `infra/cloudflare.tf`); the site key
  and secret are wired into the env manifest automatically.
- Cloudflare R2 buckets and their scoped API tokens are allocated by OpenTofu,
  one bucket per tier (`<project>-prod` and `<project>-dev`).

### Prerequisites

- [OpenTofu](https://opentofu.org/docs/intro/install/) >= 1.8
- API credentials for Neon, Upstash, Cloudflare, and Vercel

### First-time setup

```bash
# 1. Fill in credentials: provider tokens, IDs, project config, app secrets
cp infra/terraform.tfvars.example infra/terraform.tfvars
# edit infra/terraform.tfvars with your real values

# 2. Initialise providers
cd infra && tofu init

# 3. Review the plan
tofu plan

# 4. Apply
tofu apply

# 5. Local env vars — .env.example lists every variable the app reads
cp .env.example .env
# edit .env with your real values (tofu output has most of them)

# 6. Migrate database
pnpm db:push

# Optional, for the Vercel target: link the project and pull env vars instead
# of maintaining .env by hand.
vercel link
vercel env pull --environment=development .env.local

```

### State

State is **local**: `infra/terraform.tfstate`, git-ignored, and unencrypted.
There is no backend block, so whoever runs `tofu apply` holds the only copy —
fine for one operator, wrong the moment two people apply. Moving to a shared
backend (an S3-compatible bucket such as R2, with locking) is the first change
to make when that happens.

Treat the file as a secret. The Neon role passwords, the Upstash REST token,
the R2 secret access key and every value in `infra/app_env.tf` are resource
attributes, and those are unavoidably in state. Keep a backup somewhere
private; `.dockerignore` and `.gitignore` both exclude it.

**Losing it destroys nothing.** No resource is deleted and the app keeps
running, but OpenTofu forgets what it manages: rebuilding means `tofu import`
for each resource, or the next `apply` tries to create duplicates.

## TODOs

- [ ] PWA on app store: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable#installation_from_an_app_store
- [ ] Zero sync?
- [ ] Proper site.manifest and favicons: https://realfavicongenerator.net
- [ ] https://github.com/LukasNiessen/ArchUnitTS
- [ ] Contact form from animal-shelter
- [ ] Client.form submit wrapper to handle toast, form.reset(), etc
- [ ] Paystack-Better-Auth
- [ ] Paraglide
