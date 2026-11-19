#!/usr/bin/env bash
set -euo pipefail

SITE_ROOT=/var/www/brinu
RELEASES="$SITE_ROOT/releases"
current="$(readlink -f "$SITE_ROOT/current" || true)"

if [[ $# -ge 1 ]]; then
  target="$RELEASES/$1"
else
  mapfile -t ordered < <(ls -1dt "$RELEASES"/*/ | sed 's:/$::')
  target=""
  for i in "${!ordered[@]}"; do
    if [[ "${ordered[$i]}" == "$current" ]]; then
      target="${ordered[$((i + 1))]:-}"
      break
    fi
  done
fi

if [[ -z "$target" || ! -d "$target" ]]; then
  echo "No release to roll back to. Available, newest first:" >&2
  ls -1t "$RELEASES" >&2
  exit 1
fi

ln -sfn "$target" "$SITE_ROOT/current.tmp"
mv -T "$SITE_ROOT/current.tmp" "$SITE_ROOT/current"
echo "current -> $(basename "$target")"
