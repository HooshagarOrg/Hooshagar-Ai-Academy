#!/usr/bin/env bash
# Single-container mode on port 3000 (quick test)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy from env.example or .env.docker.example first."
  exit 1
fi

docker compose -f docker-compose.single.yml build
docker compose -f docker-compose.single.yml up -d
docker compose -f docker-compose.single.yml ps

echo ""
echo "App: http://YOUR_SERVER_IP:3000"
