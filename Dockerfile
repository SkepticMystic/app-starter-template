# syntax=docker/dockerfile:1.10

# NODE_VERSION is a convenience default for a local `docker build`, NOT the
# authority. `engines.node` in package.json is, and `engine-strict=true` in
# .npmrc makes pnpm refuse to install when the running Node does not satisfy
# it — so drift between the two fails this build loudly instead of shipping.
# CI passes the exact value read back out of package.json.
ARG NODE_VERSION=24

# Debian, not Alpine, deliberately, and the SAME base in every stage.
#
# Every native binding in this dependency tree ships one build per libc, and
# pnpm selects the variant matching the machine that ran `install`. Verified
# present in this lockfile, all glibc (`-gnu`) builds:
#
#   @img/sharp-linux-x64, @img/sharp-libvips-linux-x64
#   @oxlint/binding-linux-x64-gnu, @oxfmt/binding-linux-x64-gnu
#   @oxlint-tsgolint/linux-x64
#
# Install on glibc, run on musl, and the process dies at the first
# `require("sharp")`. One base makes that impossible rather than merely
# unlikely. Alpine would also get sharp's slower musl libvips build.
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# corepack reads `packageManager` from package.json, so the pnpm version stays
# written down in exactly one place.
RUN corepack enable
WORKDIR /app

# ---------------------------------------------------------------------------
# deps — every install input and nothing else, so this layer's cache key is
# effectively the lockfile
# ---------------------------------------------------------------------------
#
# patches/ and pnpm-workspace.yaml are install inputs, not extras:
# `patchedDependencies` points at patches/better-auth-paystack@3.2.1.patch, and
# the `catalog:` entries for vite/vite-plus resolve out of the workspace file.
# .npmrc carries engine-strict=true, which is the Node version guard above.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY patches ./patches

# --ignore-scripts: `prepare` is `vp config`, which installs git hooks into a
# .git this build context does not contain. Nothing else needs a lifecycle
# script — sharp 0.35 has no install/postinstall (its binary arrives as the
# @img/sharp-linux-x64 optional dependency) and @sentry/cli resolves
# @sentry/cli-linux-x64 before reaching its postinstall fallback.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ---------------------------------------------------------------------------
# prod-deps — the same lockfile, pruned, in a HOISTED layout
# ---------------------------------------------------------------------------
#
# Its own stage so the dev toolchain (vite-plus, oxlint, tsgolint, drizzle-kit,
# vitest) never reaches the runtime image.
#
# `node-linker=hoisted` is insurance, not decoration. The SSR build emits bare
# imports of transitive packages (`@noble/hashes/sha2.js`, `style-to-object`,
# `@standard-schema/spec`) that are NOT direct dependencies, so under pnpm's
# default symlinked layout they do not resolve from the app root. On Vercel
# that never mattered because @vercel/nft traced and flattened the graph; here
# nothing does. A hoisted layout puts every transitive package where Node's
# resolver will actually walk to it. The boot check at the end of the deploy
# is what proves it, per deploy.
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY patches ./patches
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --prod \
      --config.node-linker=hoisted

# ---------------------------------------------------------------------------
# build
# ---------------------------------------------------------------------------
FROM deps AS build

# Public, tier-INVARIANT values only. These four are identical on every tier
# and are shipped to browsers regardless — a DSN, two analytics ids and a
# captcha SITE key — so baking them costs nothing.
#
# PUBLIC_BASE_URL is deliberately absent. It is the one PUBLIC_ value that
# differs per tier, which is exactly why src/env.ts declares it non-static: it
# is read at runtime, and that is what lets ONE image serve every tier.
ARG PUBLIC_SENTRY_DSN=""
ARG PUBLIC_UMAMI_BASE_URL=""
ARG PUBLIC_UMAMI_WEBSITE_ID=""
ARG PUBLIC_CAPTCHA_SITE_KEY=""
ENV PUBLIC_SENTRY_DSN=$PUBLIC_SENTRY_DSN \
    PUBLIC_UMAMI_BASE_URL=$PUBLIC_UMAMI_BASE_URL \
    PUBLIC_UMAMI_WEBSITE_ID=$PUBLIC_UMAMI_WEBSITE_ID \
    PUBLIC_CAPTCHA_SITE_KEY=$PUBLIC_CAPTCHA_SITE_KEY

# sentry-cli reads all three. An auth token alone uploads nothing, because
# vite.config.ts passes no sourceMapsUploadOptions and so the plugin takes org
# and project from the environment.
ARG SENTRY_ORG=""
ARG SENTRY_PROJECT=""
ARG SENTRY_RELEASE=""
ENV SENTRY_ORG=$SENTRY_ORG \
    SENTRY_PROJECT=$SENTRY_PROJECT \
    SENTRY_RELEASE=$SENTRY_RELEASE

COPY . .

# No secrets are needed to build: src/env.ts short-circuits every schema while
# `building` is true, precisely so the image can be built without them.
#
# The Sentry token is MOUNTED, never an ARG and never COPYd — a build arg stays
# readable for the life of the image through `docker history`, to anyone who
# can pull it.
RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN \
    pnpm run build

# ---------------------------------------------------------------------------
# runtime
# ---------------------------------------------------------------------------
FROM base AS runtime

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    TZ=UTC \
    NODE_OPTIONS=--enable-source-maps

# drizzle/ ships because migrations run from this image as a one-shot container
# at deploy time. drizzle-orm's migrator only needs
# drizzle/<timestamp>_<name>/migration.sql — no drizzle-kit, no
# drizzle.config.ts, and drizzle v1 has no meta/_journal.json.
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build     --chown=node:node /app/build        ./build
COPY --chown=node:node package.json          ./
COPY --chown=node:node drizzle               ./drizzle
COPY --chown=node:node scripts/db/migrate.ts ./scripts/db/migrate.ts
COPY --chown=node:node deploy/env.required   ./env.required
COPY --chown=node:node deploy/entrypoint.sh  /usr/local/bin/entrypoint

RUN chmod +x /usr/local/bin/entrypoint

USER node
EXPOSE 3000

# No tini. adapter-node installs its own SIGTERM/SIGINT handlers, so PID 1's
# default-disposition problem does not apply, and it spawns no children to
# reap. compose sets `init: true`, which supplies docker's bundled init for
# free without adding a byte to this image.
ENTRYPOINT ["/usr/local/bin/entrypoint"]
CMD ["node", "build"]
