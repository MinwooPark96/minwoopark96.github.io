#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")"

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required. Install it first: https://brew.sh"
  exit 1
fi

if ! brew list ruby >/dev/null 2>&1; then
  echo "Homebrew Ruby is required. Run: brew install ruby"
  exit 1
fi

export PATH="$(brew --prefix ruby)/bin:$PATH"

if ! gem list --installed --exact --version 2.5.4 bundler >/dev/null; then
  gem install bundler -v 2.5.4
fi

bundle _2.5.4_ install

host="${HOST:-127.0.0.1}"
port="${PORT:-4000}"
jekyll_args=(serve --host "$host" --port "$port")

if [[ "${LIVERELOAD:-0}" == "1" || "${LIVERELOAD:-false}" == "true" ]]; then
  livereload_port="${LIVERELOAD_PORT:-35729}"
  jekyll_args+=(--livereload --livereload-port "$livereload_port")
  echo "Serving at http://$host:$port with LiveReload on port $livereload_port"
else
  echo "Serving at http://$host:$port"
  echo "Set LIVERELOAD=1 to enable LiveReload."
fi

exec bundle _2.5.4_ exec jekyll "${jekyll_args[@]}"
