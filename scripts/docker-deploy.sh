#!/usr/bin/env bash
# Build and start Hooshagar with Docker Compose (run on VPS from project root)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy from env.example or .env.docker.example first."
  exit 1
fi

echo "==> Building image..."
docker compose build

echo "==> Starting container..."
docker compose up -d

echo "==> Status:"
docker compose ps

echo ""
echo "Logs: docker compose logs -f app"
echo "App:  \${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
