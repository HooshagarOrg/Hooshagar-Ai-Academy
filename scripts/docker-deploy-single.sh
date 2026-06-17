#!/usr/bin/env bash
# Simple test stack: nginx + app + redis (3 containers)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy from env.example or .env.docker.example first."
  exit 1
fi

echo "==> Building app..."
docker compose -f docker-compose.single.yml build app

echo "==> Starting simple stack (nginx + app + redis)..."
docker compose -f docker-compose.single.yml up -d

docker compose -f docker-compose.single.yml ps

echo ""
echo "App:  http://YOUR_SERVER_IP"
echo "Logs: docker compose -f docker-compose.single.yml logs -f app nginx"
