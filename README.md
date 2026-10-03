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
  -t app .

# Migrations are a separate one-shot step, never the entrypoint: replicas
# starting together would race, and neon-http has no transactions to lock with.
docker run --rm --env-file .env app pnpm db:migrate:run

docker run -p 3000:3000 --env-file .env -e ORIGIN=https://your.domain app
```

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
See the Deployment section of `AGENTS.md` for the `adapter-node` runtime
variables (`ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH`, `BODY_SIZE_LIMIT`) and why
each one matters.

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
# 1. Fill in credentials
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

State is stored locally in `infra/terraform.tfstate` (git-ignored). Keep this file backed up — it contains sensitive values (DB passwords, Redis URLs). To share state across a team, migrate to a [remote backend](https://opentofu.org/docs/language/settings/backends/).

## TODOs

- [ ] PWA on app store: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable#installation_from_an_app_store
- [ ] Zero sync?
- [ ] Proper site.manifest and favicons: https://realfavicongenerator.net
- [ ] https://github.com/LukasNiessen/ArchUnitTS
- [ ] Contact form from animal-shelter
- [ ] Client.form submit wrapper to handle toast, form.reset(), etc
- [ ] Paystack-Better-Auth
- [ ] Paraglide
