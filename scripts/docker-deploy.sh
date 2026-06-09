#!/usr/bin/env bash
# Build and start Hooshagar production stack (nginx + 2×app + redis + monitoring)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy from env.example or .env.docker.example first."
  exit 1
fi

echo "==> Building app image..."
docker compose build app

echo "==> Starting production stack..."
docker compose up -d

echo "==> Status:"
docker compose ps

echo ""
echo "App (via nginx):  http://\$(curl -s ifconfig.me 2>/dev/null || echo YOUR_SERVER_IP)"
echo "Uptime Kuma:      http://YOUR_SERVER_IP:3001"
echo "Portainer:        https://YOUR_SERVER_IP:9443"
echo "Logs:             docker compose logs -f app nginx"
