#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIB_ROOT="$ROOT_DIR/.cache/playwright-libs/root/usr/lib/x86_64-linux-gnu"
DEB_DIR="$ROOT_DIR/.cache/playwright-libs/debs"
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:4173}"
PREVIEW_PID=""

ensure_local_linux_deps() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    return 0
  fi

  local required_libs=(
    "libnspr4.so"
    "libnss3.so"
    "libnssutil3.so"
    "libatk-1.0.so.0"
    "libatk-bridge-2.0.so.0"
    "libatspi.so.0"
    "libXdamage.so.1"
    "libxkbcommon.so.0"
    "libasound.so.2"
  )

  local missing=0
  for lib in "${required_libs[@]}"; do
    if [[ ! -e "$LIB_ROOT/$lib" ]] && ! ldconfig -p 2>/dev/null | grep -q "$lib"; then
      missing=1
      break
    fi
  done

  if [[ "$missing" -eq 0 ]]; then
    return 0
  fi

  if ! command -v apt >/dev/null 2>&1 || ! command -v dpkg-deb >/dev/null 2>&1; then
    echo "[playwright-deps] apt/dpkg-deb indisponibles pour bootstrap local Linux." >&2
    return 1
  fi

  mkdir -p "$DEB_DIR" "$LIB_ROOT"
  (
    cd "$DEB_DIR"
    apt download \
      libnspr4 \
      libnss3 \
      libatk1.0-0t64 \
      libatk-bridge2.0-0t64 \
      libatspi2.0-0t64 \
      libxdamage1 \
      libxkbcommon0 \
      libasound2t64
  )

  for deb in "$DEB_DIR"/*.deb; do
    dpkg-deb -x "$deb" "$ROOT_DIR/.cache/playwright-libs/root"
  done
}

ensure_local_linux_deps
if [[ -d "$LIB_ROOT" ]]; then
  export LD_LIBRARY_PATH="$LIB_ROOT:${LD_LIBRARY_PATH:-}"
fi

cleanup_preview() {
  if [[ -n "$PREVIEW_PID" ]] && kill -0 "$PREVIEW_PID" 2>/dev/null; then
    kill "$PREVIEW_PID" 2>/dev/null || true
    wait "$PREVIEW_PID" 2>/dev/null || true
  fi
}

start_local_preview() {
  if [[ -n "${PLAYWRIGHT_EXTERNAL_SERVER:-}" ]]; then
    return 0
  fi

  (
    cd "$ROOT_DIR"
    npm run preview -- --host 127.0.0.1 --port 4173 >/tmp/bougnat-playwright-preview.log 2>&1
  ) &
  PREVIEW_PID=$!
  trap cleanup_preview EXIT

  (
    cd "$ROOT_DIR"
    npm exec -- wait-on "$PLAYWRIGHT_BASE_URL"
  )
}

start_local_preview
cd "$ROOT_DIR"
PLAYWRIGHT_BASE_URL="$PLAYWRIGHT_BASE_URL" exec npm exec -- playwright "$@"
