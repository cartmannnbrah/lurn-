#!/usr/bin/env sh
set -eu

if ! command -v pi >/dev/null 2>&1; then
  echo "Pi is not installed or is not on PATH. See the Pi installation instructions in README.md."
  exit 127
fi

exec pi "$@"
