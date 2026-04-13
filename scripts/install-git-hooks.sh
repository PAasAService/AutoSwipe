#!/bin/sh
# Point this repo at versioned hooks under .githooks/ (post-merge, post-checkout, post-rewrite).
# Run once per clone: ./scripts/install-git-hooks.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Not a git repository: $ROOT" >&2
  exit 1
fi

chmod +x .githooks/post-merge .githooks/post-checkout .githooks/post-rewrite .githooks/sync-dev-environment.sh 2>/dev/null || true

git config core.hooksPath .githooks
echo "core.hooksPath set to .githooks"
echo "Hooks will run npm install and Prisma steps after pull/checkout/rebase when relevant files change."
