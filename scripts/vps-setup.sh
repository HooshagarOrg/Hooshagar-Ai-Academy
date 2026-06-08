#!/usr/bin/env bash
# آماده‌سازی اولیه VPS اوبونتو برای Docker deploy
set -euo pipefail

echo "==> Updating packages..."
sudo apt update && sudo apt upgrade -y

echo "==> Installing git and curl..."
sudo apt install -y git curl

echo "==> Checking Docker..."
if ! command -v docker &>/dev/null; then
  echo "Docker not found. Install from https://docs.docker.com/engine/install/ubuntu/"
  exit 1
fi
docker --version
docker compose version

echo "==> Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
echo "y" | sudo ufw enable || true
sudo ufw status

echo ""
echo "Done. Next steps:"
echo "  1. git clone <repo> ~/hooshagar"
echo "  2. cd ~/hooshagar && cp env.example .env && nano .env"
echo "  3. docker compose up -d --build"
echo ""
echo "See docs/DOCKER_VPS.md for full guide."
