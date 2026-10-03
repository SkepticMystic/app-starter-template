# syntax=docker/dockerfile:1.7

# Debian slim, not Alpine: `sharp` ships glibc prebuilt binaries, and on musl it
# either builds from source slowly or fails outright.
# The tag must satisfy `engines.node` in package.json — .npmrc sets
# engine-strict=true, so a lower version fails at install rather than at runtime.
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# corepack reads `packageManager` from package.json. The download prompt would
# otherwise block an unattended build.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable pnpm
WORKDIR /app

FROM base AS build
# pnpm-workspace.yaml carries the `catalog:` entries package.json refers to, and
# patches/ carries the patchedDependencies patch. Install fails without either.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY patches ./patches
# --ignore-scripts skips the root `prepare` script (`vp config`), which installs
# the git hooks and so shells out to git — absent from node:*-slim, and pnpm
# treats a failed lifecycle script as a failed install. Installing git instead
# works but makes every build depend on reaching a Debian mirror.
# `pnpm rebuild` then runs the DEPENDENCY install scripts that --ignore-scripts
# skipped, which is what `allowBuilds` in pnpm-workspace.yaml is about
# (sharp, @sentry/cli).
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts \
    && pnpm rebuild

COPY . .

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
ARG APP_ENV=production
ARG PUBLIC_BASE_URL
ARG PUBLIC_SENTRY_DSN=""
ARG PUBLIC_CAPTCHA_SITE_KEY=""
ARG PUBLIC_UMAMI_BASE_URL=""
ARG PUBLIC_UMAMI_WEBSITE_ID=""
ENV APP_ENV=$APP_ENV \
    PUBLIC_BASE_URL=$PUBLIC_BASE_URL \
    PUBLIC_SENTRY_DSN=$PUBLIC_SENTRY_DSN \
    PUBLIC_CAPTCHA_SITE_KEY=$PUBLIC_CAPTCHA_SITE_KEY \
    PUBLIC_UMAMI_BASE_URL=$PUBLIC_UMAMI_BASE_URL \
    PUBLIC_UMAMI_WEBSITE_ID=$PUBLIC_UMAMI_WEBSITE_ID
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production
# adapter-node defaults. ORIGIN has no sensible default and must be supplied at
# run time — without it every form POST fails SvelteKit's CSRF origin check.
ENV PORT=3000
ENV HOST=0.0.0.0

# The whole tree, not a --prod prune. Several packages the server bundle leaves
# external still live in devDependencies, and `pnpm install --prod` would also
# run the root `prepare` script (`vp config`), whose binary is a devDependency.
# Shrinking this is a follow-up: build, then check every bare specifier in
# build/server/ is in `dependencies` before pruning.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
# For `pnpm db:migrate:run`, which is a separate one-shot step, not the CMD.
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts

EXPOSE 3000
USER node
CMD ["node", "build"]
