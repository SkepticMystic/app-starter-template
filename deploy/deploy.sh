#!/usr/bin/env bash
# Blue/green deploy of one tier on a single box.
#
# Usage: deploy.sh <tier> <image-ref-by-digest>
set -Eeuo pipefail

tier="${1:?tier}"
image="${2:?image ref, by digest}"

root=/opt/app-starter
compose="$root/deploy/compose.yaml"
state="$root/state/$tier"

mkdir -p "$state"

active="$(cat "$state/active-colour" 2>/dev/null || echo green)"
case "$active" in
  blue) next=green ;;
  *) next=blue ;;
esac

echo "deploy: tier=$tier active=$active next=$next"

docker pull "$image"

# Migrations run here: once per deploy, from the image being deployed, before
# it serves any traffic. Not in `docker build` (no database at build time) and
# not in the entrypoint (every restart of every colour would race). The
# advisory lock inside migrate.ts is the second belt.
echo "deploy: migrating"
docker run --rm \
  --env-file "$root/env/$tier.env" \
  --network app-starter-edge \
  "$image" node scripts/db/migrate.ts

APP_IMAGE="$image" \
APP_ENV_FILE="$root/env/$tier.env" \
docker compose -f "$compose" --profile "$next" up -d --wait \
  --wait-timeout 180 "app_$next"

# Caddy probes every 5s and lb_policy=first moves traffic as soon as the new
# colour is available. Two intervals of slack before pulling the old one.
sleep 12

echo "deploy: stopping $active"
APP_IMAGE="$image" \
APP_ENV_FILE="$root/env/$tier.env" \
docker compose -f "$compose" --profile "$active" stop --timeout 40 "app_$active" || true

APP_IMAGE="$image" \
APP_ENV_FILE="$root/env/$tier.env" \
docker compose -f "$compose" --profile "$active" rm -f "app_$active" || true

# Rollback inputs, written only after success.
if [ -f "$state/image" ]; then
  cp -f "$state/image" "$state/previous-image"
fi
printf '%s' "$image" >"$state/image"
printf '%s' "$next" >"$state/active-colour"

echo "deploy: done, serving $next"
