#!/usr/bin/env bash
# Roll the previous image back in.
#
# Usage: rollback.sh <tier>
#
# THIS ROLLS BACK CODE ONLY. drizzle emits no down migrations, so whatever the
# failed deploy applied to the schema is still applied. That is why every schema
# change must be backward-compatible with the previous image (expand/contract:
# add nullable columns and new tables in one deploy, backfill, switch reads,
# drop in a later one). Vercel's instant-rollback button hid this constraint;
# it does not exist here.
set -Eeuo pipefail

tier="${1:?tier}"

root=/opt/app-starter
compose="$root/deploy/compose.yaml"
state="$root/state/$tier"

previous="$(cat "$state/previous-image" 2>/dev/null || true)"

if [ -z "$previous" ]; then
  echo "rollback: no previous image recorded for $tier" >&2
  exit 1
fi

active="$(cat "$state/active-colour" 2>/dev/null || echo green)"
case "$active" in
  blue) next=green ;;
  *) next=blue ;;
esac

echo "rollback: tier=$tier -> $previous (into $next)"
echo "rollback: SCHEMA IS NOT ROLLED BACK — see the header of this script."

docker pull "$previous"

APP_IMAGE="$previous" \
APP_ENV_FILE="$root/env/$tier.env" \
docker compose -f "$compose" --profile "$next" up -d --wait \
  --wait-timeout 180 "app_$next"

sleep 12

APP_IMAGE="$previous" \
APP_ENV_FILE="$root/env/$tier.env" \
docker compose -f "$compose" --profile "$active" stop --timeout 40 "app_$active" || true

printf '%s' "$previous" >"$state/image"
printf '%s' "$next" >"$state/active-colour"

echo "rollback: done, serving $next"
