# syntax=docker/dockerfile:1.7

# One image per origin: `APP_ENV` and the `PUBLIC_*` set are compiled in (build
# args below), every other value is read at boot through `$app/env/private`, so
# no secret lands in a layer. Beyond those, the build takes only the commit
# (`SENTRY_RELEASE`) and an optional source-map token (a BuildKit secret).
#
# Debian slim, not Alpine: `sharp`, `vite-plus` and `@sentry/cli` ship prebuilt
# binaries, and the lockfile resolves their glibc variants.
#
# The tag must satisfy `engines.node` in package.json — .npmrc sets
# engine-strict=true, so a lower version fails at install rather than at
# runtime. `.nvmrc` is the other place the major is written.
ARG NODE_VERSION=26-slim


# --- base ---------------------------------------------------------------------
# Node plus pnpm, for the two stages that install. The runtime stage is not
# built on it: it gets no pnpm, no corepack download and no metadata cache.

FROM node:${NODE_VERSION} AS base

WORKDIR /app

ENV CI=true

# `vp config` (the `prepare` script) installs git hooks, and there is no git
# here. Install skips `prepare` anyway (--ignore-scripts); this is for anything
# else that reaches it.
ENV VP_GIT_HOOKS=0

# corepack reads `packageManager`, so that stays the only place the pnpm version
# is written. Node stopped bundling corepack at 25, so `node:26-slim` has npm
# but no `corepack` binary: it is installed through npm rather than replaced by
# `npm install -g pnpm@<version>`, which would write the version down twice.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN npm install -g corepack && corepack enable pnpm

# One BuildKit cache for both installs' stores, so the `--prod` install fetches
# nothing new.
ENV PNPM_HOME=/pnpm
RUN pnpm config set store-dir /pnpm/store

# `pnpm install` needs every one: pnpm-workspace.yaml carries the `catalog:`
# entries and `allowBuilds`, patches/ the patchedDependencies patch, and .npmrc
# engine-strict.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY patches/ ./patches/


# --- build --------------------------------------------------------------------

FROM base AS build

# Manifests (in `base`) before source, so a source-only change reuses the
# install layer. `--ignore-scripts` skips the root `prepare` (`pnpm build` syncs kit itself)
# and the dependency postinstalls: `sharp` and `@sentry/cli` both get their
# binaries from a platform `optionalDependency`, not from a script.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# The build's inputs by name, not `COPY . .`, so a migration, script or doc
# change does not invalidate this layer. `oxlint.config.ts` because
# `vite.config.ts` imports it; a new root-level build input goes here too.
COPY vite.config.ts oxlint.config.ts tsconfig.json ./
COPY static/ ./static/
COPY src/ ./src/

# SvelteKit's postbuild `analyse` step imports every server module to collect
# route metadata, so module-scope client construction runs during the build:
# `neon(DATABASE_URL)`, `new Resend(...)`, `pino({ level })` and friends all
# throw on an undefined value. They need SOMETHING present, not the real thing.
#
# .env.example is placeholders only, so this satisfies the analyse step without
# putting a credential anywhere near an image layer. It is not copied into the
# runtime stage, and adapter-node does not read .env in production anyway —
# real values come from the container's environment at run time.
# Build args below are set as ENV, which takes precedence over these.
COPY .env.example .env

# No VERCEL in the environment, so vite.config.ts selects adapter-node.
# PUBLIC_* vars and APP_ENV are read at build time, so they must be present
# here; everything else is read at runtime via $app/env/private and must
# NOT be passed in, so no secret ends up in an image layer.
# PUBLIC_BASE_URL also becomes `paths.origin` in vite.config.ts — the origin
# SvelteKit trusts for CSRF checks — which is why there is no runtime ORIGIN.
ARG APP_ENV=production
ARG PUBLIC_BASE_URL
ARG PUBLIC_SENTRY_DSN=""
ARG PUBLIC_CAPTCHA_SITE_KEY=""
ARG PUBLIC_UMAMI_BASE_URL=""
ARG PUBLIC_UMAMI_WEBSITE_ID=""
ENV APP_ENV=$APP_ENV \
    PUBLIC_APP_ENV=$APP_ENV \
    PUBLIC_BASE_URL=$PUBLIC_BASE_URL \
    PUBLIC_SENTRY_DSN=$PUBLIC_SENTRY_DSN \
    PUBLIC_CAPTCHA_SITE_KEY=$PUBLIC_CAPTCHA_SITE_KEY \
    PUBLIC_UMAMI_BASE_URL=$PUBLIC_UMAMI_BASE_URL \
    PUBLIC_UMAMI_WEBSITE_ID=$PUBLIC_UMAMI_WEBSITE_ID

# The Sentry source-map upload runs only when the token is passed as a build
# secret (`--secret id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN`) — a secret,
# not an ARG, so it never reaches a layer or `docker history`. `required=false`
# for every other build. Unset, `SENTRY_RELEASE` falls back to a random id per
# build (`.git` is not in the context), so pass the commit.
#
# The `find` is the only way to drop adapter-node's server maps: its own
# rollup pass hardcodes `sourcemap: true`. Nothing at runtime reads them.
ARG SENTRY_RELEASE
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN,required=false \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/SENTRY_AUTH_TOKEN 2>/dev/null || true)" \
    SENTRY_RELEASE="${SENTRY_RELEASE}" \
    pnpm build && find build -name '*.map' -delete


# --- deps ---------------------------------------------------------------------

FROM base AS deps

# adapter-node bundles everything except `dependencies`, so those are all the
# server needs at run time — checked by listing every bare specifier under
# `build/`. `--ignore-scripts` because `prepare` would run `vp`, a
# devDependency.
#
# It is still not lean: pnpm installs the peers the lockfile resolved for
# them, so better-auth's optional `drizzle-kit` peer and kit's `vite` (here,
# vite-plus) come along. Only a lockfile change shrinks that.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile --ignore-scripts


# --- runtime ------------------------------------------------------------------

FROM node:${NODE_VERSION} AS runtime

WORKDIR /app

ENV NODE_ENV=production

# adapter-node defaults. Since SvelteKit 3 there is no ORIGIN variable: the
# origin is baked in at build time from PUBLIC_BASE_URL (see above).
ENV PORT=3000
ENV HOST=0.0.0.0

# adapter-node's 512kB default rejects an image upload long before
# `IMAGE_HOSTING.LIMITS.MAX_FILE_SIZE_BYTES` (5MB) does. 6M is one such file
# plus multipart overhead; raise both together.
ENV BODY_SIZE_LIMIT=6M

# Seconds adapter-node spends closing connections before `sveltekit:shutdown`,
# after which `RuntimeService.drain` gets up to 30s more. A stop grace period
# (`docker run --stop-timeout`, compose's `stop_grace_period`) must exceed the
# sum, or the drain is SIGKILLed — docker's default is 10s.
ENV SHUTDOWN_TIMEOUT=20

# `type: module`, which `node build` needs.
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build

# Migration SQL and its devDependency-free runner, for the one-shot release
# step — not the CMD. There is no pnpm in this stage, so it is run as
# `node scripts/db/migrate.script.ts`, which is all `pnpm db:migrate:run` does.
COPY drizzle/ ./drizzle/
COPY scripts/db/migrate.script.ts ./scripts/db/migrate.script.ts

EXPOSE 3000
USER node
CMD ["node", "build"]
