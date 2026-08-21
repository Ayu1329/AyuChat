#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Building AyuChat desktop (Windows x64 exe → dist/)"
pnpm build

echo "==> Done. Artifacts:"
ls -la dist/*.exe 2>/dev/null || ls -la dist/
