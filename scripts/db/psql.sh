#!/usr/bin/env bash
set -euo pipefail

# Real psql, run from a container so the repo needs no system Postgres install and no sudo.
# postgres:18-alpine matches the server version Neon runs; override with PSQL_IMAGE if that
# ever drifts. A newer client talks to an older server fine, the reverse is not guaranteed:
# an older psql's \d meta-commands query catalogs that a newer server may have reshaped.
IMAGE="${PSQL_IMAGE:-postgres:18-alpine}"

# DATABASE_URL normally arrives from the caller: 'db:sql:prod' supplies it through dotenvx.
# For dev we fall back to .env.local, which keeps the common case instant and offline
# instead of depending on a secret manager being reachable.
if [[ -z "${DATABASE_URL:-}" ]]; then
  root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
  env_file="$root/.env.local"

  if [[ -f "$env_file" ]]; then
    line="$(grep -E '^DATABASE_URL=' "$env_file" | head -1 || true)"
    value="${line#DATABASE_URL=}"
    # strip one layer of surrounding quotes, whichever kind was used
    value="${value%\"}"; value="${value#\"}"
    value="${value%\'}"; value="${value#\'}"
    export DATABASE_URL="$value"
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "psql.sh: no DATABASE_URL in the environment and none found in .env.local." >&2
  echo "Add DATABASE_URL to .env.local, or use 'pnpm db:sql:prod' for production." >&2
  exit 1
fi

# These three flags are what make psql safe to hand to a script or an agent:
#   pager=off      a pager has nothing to attach to without a TTY and would hang forever
#   expanded=auto  wide rows print as records instead of wrapping into unreadable noise
#   ON_ERROR_STOP  a failed statement exits non-zero instead of scrolling past unnoticed
psql_args=(-v ON_ERROR_STOP=1 -P pager=off -P expanded=auto)

# DATABASE_URL is passed as an env var and expanded inside the container, so the credential
# never appears in host argv where any other process could read it off the process list.
docker_args=(--rm -i -e DATABASE_URL)
if [[ -t 0 && -t 1 ]]; then docker_args+=(-t); fi

if [[ $# -eq 0 ]]; then
  : # interactive shell on a TTY, otherwise psql reads SQL from stdin
elif [[ "$1" == -* ]]; then
  psql_args+=("$@") # explicit psql flags (-c, -f, --csv, ...) pass through untouched
else
  # bare arguments are SQL, so 'pnpm db:sql "select 1"' works without remembering -c
  for stmt in "$@"; do psql_args+=(-c "$stmt"); done
fi

exec docker run "${docker_args[@]}" "$IMAGE" \
  sh -c 'exec psql "$DATABASE_URL" "$@"' psql "${psql_args[@]}"
