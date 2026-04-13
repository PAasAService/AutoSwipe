#!/bin/sh
# Shared logic after pulls / branch checkouts / rebases.
# Keeps npm deps and Prisma client/migrations in sync when teammates change them.
#
# Install once from repo root: ./scripts/install-git-hooks.sh

set -e

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$ROOT" || exit 0

# Skip in CI or when hooks are disabled
if [ -n "${CI:-}" ] || [ "${AUTOSWIPE_SKIP_POST_PULL_SYNC:-}" = "1" ]; then
  exit 0
fi

ZERO=0000000000000000000000000000000000000000

is_zero_ref() {
  case "$1" in
  "$ZERO"|'') return 0 ;;
  *) return 1 ;;
  esac
}

# Lists paths changed between two refs (inclusive of new tree on clone).
changed_paths() {
  old_ref=$1
  new_ref=$2
  if is_zero_ref "$old_ref"; then
    git diff-tree --no-commit-id --name-only -r "$new_ref" 2>/dev/null || true
  else
    git diff --name-only "$old_ref" "$new_ref" 2>/dev/null || true
  fi
}

run_web_install() {
  echo "[githooks] autoswipe: npm install"
  (cd autoswipe && npm install)
}

run_native_install() {
  echo "[githooks] autoswipe-native: npm install"
  (cd autoswipe-native && npm install)
}

run_prisma_deploy() {
  echo "[githooks] autoswipe: prisma migrate deploy"
  (cd autoswipe && npx prisma migrate deploy) || {
    echo "[githooks] prisma migrate deploy failed (missing .env or DB?). Fix locally; continuing." >&2
    return 0
  }
}

run_prisma_generate_only() {
  echo "[githooks] autoswipe: prisma generate"
  (cd autoswipe && npx prisma generate)
}

# Decide what to run from a newline-separated path list.
sync_from_changed_list() {
  changed=$1

  web_pkg=$(printf '%s\n' "$changed" | grep -E '^autoswipe/(package\.json|package-lock\.json)$' || true)
  web_prisma=$(printf '%s\n' "$changed" | grep -E '^autoswipe/prisma/' || true)
  native_pkg=$(printf '%s\n' "$changed" | grep -E '^autoswipe-native/(package\.json|package-lock\.json)$' || true)

  if [ -n "$native_pkg" ]; then
    run_native_install
  fi

  if [ -n "$web_pkg" ]; then
    run_web_install
    # postinstall already runs prisma generate
    if [ -n "$web_prisma" ]; then
      run_prisma_deploy
    fi
    return 0
  fi

  if [ -n "$web_prisma" ]; then
    run_prisma_generate_only
    run_prisma_deploy
  fi
}

sync_range() {
  old_ref=$1
  new_ref=$2

  if ! command -v npm >/dev/null 2>&1; then
    echo "[githooks] npm not found; skip dev sync." >&2
    exit 0
  fi

  if [ ! -d autoswipe ] || [ ! -d autoswipe-native ]; then
    exit 0
  fi

  list=$(changed_paths "$old_ref" "$new_ref")
  if [ -z "$list" ]; then
    exit 0
  fi

  relevant=$(printf '%s\n' "$list" | grep -E '^autoswipe/(package\.json|package-lock\.json)$|^autoswipe/prisma/|^autoswipe-native/(package\.json|package-lock\.json)$' || true)
  if [ -z "$relevant" ]; then
    exit 0
  fi

  echo "[githooks] Syncing dev environment (deps or Prisma changed)..."
  sync_from_changed_list "$list"
  echo "[githooks] Done."
}

mode=$1
shift

case "$mode" in
post-merge)
  # Merge pull: first parent = HEAD before the merge.
  if git rev-parse --verify HEAD^1 >/dev/null 2>&1; then
    sync_range "$(git rev-parse HEAD^1)" "$(git rev-parse HEAD)"
  fi
  ;;
post-checkout)
  # $1 = prev HEAD, $2 = new HEAD, $3 = 1 branch checkout / 0 paths only
  prev=$1
  new=$2
  flag=$3
  if [ "$flag" != "1" ]; then
    exit 0
  fi
  sync_range "$prev" "$new"
  ;;
post-rewrite)
  # Only after rebase (pull --rebase); skip amend to avoid noise.
  cmd=${1:-}
  if [ "$cmd" != "rebase" ]; then
    exit 0
  fi
  if ! git rev-parse --verify ORIG_HEAD >/dev/null 2>&1; then
    exit 0
  fi
  sync_range "$(git rev-parse ORIG_HEAD)" "$(git rev-parse HEAD)"
  ;;
*)
  echo "Usage: sync-dev-environment.sh post-merge|post-checkout <args>|post-rewrite <amend|rebase>" >&2
  exit 1
  ;;
esac

exit 0
