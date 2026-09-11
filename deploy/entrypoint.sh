#!/bin/sh
# Refuse to start without the environment the app needs.
#
# `$env/static/*` used to give this for free: a missing DATABASE_URL or
# VERCEL_ENV failed the BUILD. Runtime environment variables are what let one
# image serve every tier, and the price is that the same mistake could boot a
# container that looks healthy while writing to `app-starter:undefined:` in a
# Redis instance shared with other projects.
#
# src/env.ts is the precise half of the replacement (it validates values inside
# Server.init, before the port is bound). This is the blunt, earlier half.
set -eu

REQUIRED_FILE=/app/env.required
missing=""

while IFS= read -r name || [ -n "$name" ]; do
  case "$name" in
    "" | \#*) continue ;;
  esac

  eval "value=\${$name-}"

  if [ -z "$value" ]; then
    missing="$missing $name"
  fi
done <"$REQUIRED_FILE"

if [ -n "$missing" ]; then
  echo "entrypoint: refusing to start, missing required environment:$missing" >&2
  exit 78 # EX_CONFIG
fi

exec "$@"
