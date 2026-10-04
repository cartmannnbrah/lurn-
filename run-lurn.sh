#!/usr/bin/env sh
set -eu

if [ -z "${LURN_OBSIDIAN_VAULT:-}" ] || [ "$LURN_OBSIDIAN_VAULT" = "$HOME/Documents/Lurn" ]; then
  LURN_OBSIDIAN_VAULT="$HOME/Documents/Obsidian Vault"
  export LURN_OBSIDIAN_VAULT
fi

if ! command -v pi >/dev/null 2>&1; then
  echo "Pi is not installed or is not on PATH. See the Pi installation instructions in README.md."
  exit 127
fi

exec pi "$@"
