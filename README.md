# App Starter Template

## Features

- SvelteKit, TypeScript
- shadcn-svelte
- ESLint, Prettier
- Better-Auth
- Drizzle, Redis
- Vercel

## Usage

### Local Development

1. Clone the repository

   ```bash
   git clone https://github.com/SkepticMystic/app-starter-template.git
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables

   Create a `.env` file in the root directory and add the necessary environment variables. You can refer to the `.env.example` file for guidance.

   Part of this step is setting up a new postgres db (I currently use neon). Create a development branch in the neon dashboard, and copy the connection string to your .env file as `DATABASE_URL`.

   Then run the following command to create the necessary tables:

   ```bash
   npm run db push
   ```

4. Run the development server

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173` to see the app in action.

### Deployment

1. Push your code to a Git repository (e.g., GitHub, GitLab).
2. Connect your repository to Vercel.
3. Set up the environment variables in the Vercel dashboard.
4. Edit the build command to `vite build && npm run db migrate` in the Vercel dashboard.
5. Deploy the app using Vercel.

## Infrastructure

Cloud resources are managed with [OpenTofu](https://opentofu.org/) in the `infra/` directory.

Resources managed:

| Service                              | Provider                | What's provisioned                             |
| ------------------------------------ | ----------------------- | ---------------------------------------------- |
| [Neon](https://neon.tech)            | `kislerdm/neon`         | Project, production branch, database, app role |
| [Upstash](https://upstash.com)       | `upstash/upstash`       | Redis database                                 |
| [Cloudflare](https://cloudflare.com) | `cloudflare/cloudflare` | R2 bucket                     |
| [Vercel](https://vercel.com)         | `vercel/vercel`         | Project config + all environment variables     |

**Note:** 

- Cloudflare Turnstile widgets must be created manually in the Cloudflare dashboard. Add the resulting site key and secret key to `terraform.tfvars`.
- Cloudflare R2 buckets are allocated by TOFU, but we have 

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

# 5. Initialise Vercel project
vercel link

# 6. Pull local env vars from Vercel
vercel env pull --environment=development .env.local

# 7. Migrate database
pnpm db:push

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
