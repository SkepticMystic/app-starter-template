#!/usr/bin/env bash
set -euo pipefail

# Renders every raster brand asset in static/ from static/favicon.svg, the one source of truth
# for the mark. Re-run after changing the mark, or after a rename (the OG image carries the name):
#
#   pnpm brand:generate "App Starter" "An awesome app built with SvelteKit and BetterAuth"
#   pnpm brand:generate "Acme" "Invoices that send themselves" "#e11d48" "#18181b" "#d4d4d8"
#
# Arguments: <name> <tagline> [accent] [background] [muted]. The name and tagline are not read
# from APP.NAME and APP.DESCRIPTION, because app.const.ts imports $app/* and cannot be evaluated
# by a shell; pass the same values. The colours default to the template's: accent is --primary
# in layout.css (the OG image's bottom rule), background is the dark theme's --background, muted
# is the tagline's ink. favicon.svg carries its own fill; change that there.
#
# Needs ImageMagick 6 or 7 and fontconfig. The mark is plain rects, which ImageMagick's own SVG
# renderer draws correctly, so no rsvg or browser is involved.

usage="usage: generate.sh <name> <tagline> [accent] [background] [muted]"
name="${1:?$usage}"
tagline="${2:?$usage}"
accent="${3:-#6468f0}"
ink="${4:-#0f182b}"
mist="${5:-#cbd5e1}"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
static="$root/static"
src="$static/favicon.svg"

magick_bin="$(command -v magick || command -v convert || true)"
if [[ -z "$magick_bin" ]]; then
  echo "ImageMagick not found: install it (magick or convert) and re-run." >&2
  exit 1
fi
bold="$(fc-match -f '%{file}' 'sans-serif:bold')"
regular="$(fc-match -f '%{file}' 'sans-serif')"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# Full bleed: iOS and Android mask the icon themselves, so a rounded corner of our own would
# show as a second, smaller rounding. The mark already sits inside the maskable safe circle.
sed 's/rx="14"/rx="0"/' "$src" > "$work/square.svg"

render() { # <svg> <size> <out>
  "$magick_bin" -background none -density 1536 "$1" -resize "$2x$2" -depth 8 "$3"
}

render "$src" 192 "$static/icon-192.png"
render "$src" 512 "$static/icon-512.png"
render "$work/square.svg" 512 "$static/icon-maskable-512.png"
render "$work/square.svg" 180 "$static/apple-touch-icon.png"

for size in 16 32 48; do
  render "$src" "$size" "$work/ico-$size.png"
done
"$magick_bin" "$work/ico-16.png" "$work/ico-32.png" "$work/ico-48.png" "$static/favicon.ico"

# 1200×630, the size every OG and Twitter card consumer crops to.
render "$src" 128 "$work/og-mark.png"
"$magick_bin" -size 1200x630 "xc:$ink" \
  "$work/og-mark.png" -geometry +96+150 -composite \
  -font "$bold" -pointsize 88 -fill white -annotate +96+390 "$name" \
  \( -size 1000x -background none -font "$regular" -pointsize 34 -fill "$mist" "caption:$tagline" \) \
  -geometry +96+430 -composite \
  -fill "$accent" -draw "rectangle 0,618 1200,630" \
  -depth 8 "$static/og-image.png"

echo "Wrote icons and og-image.png to $static"
