#!/bin/zsh
cd "$(dirname "$0")"

if [[ -f ".env" ]]; then
  set -a
  source ".env"
  set +a
fi

BUNDLED_PYTHON="/Users/dong/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
if [[ -x "$BUNDLED_PYTHON" ]]; then
  "$BUNDLED_PYTHON" app.py
else
  python3 app.py
fi
