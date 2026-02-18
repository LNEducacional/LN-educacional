#!/usr/bin/env bash
# =============================================================================
# VPS Provisioning Script
# Configura servidor para deploy de LN Educacional e Sistema Financeiro
# Executar como root: bash vps-setup.sh <SSH_PUBLIC_KEY> <GHCR_TOKEN> <GH_USER>
# =============================================================================
set -euo pipefail

SSH_PUBLIC_KEY="${1:?Uso: $0 <SSH_PUBLIC_KEY> <GHCR_TOKEN> <GH_USER>}"
GHCR_TOKEN="${2:?Uso: $0 <SSH_PUBLIC_KEY> <GHCR_TOKEN> <GH_USER>}"
GH_USER="${3:?Uso: $0 <SSH_PUBLIC_KEY> <GHCR_TOKEN> <GH_USER>}"

echo "=== [1/9] Atualizando sistema ==="
apt-get update && apt-get upgrade -y
apt-get install -y curl git ufw fail2ban unzip jq

echo "=== [2/9] Criando usuario deploy ==="
if ! id deploy &>/dev/null; then
  useradd -m -s /bin/bash deploy
  echo "deploy ALL=(ALL) NOPASSWD: /usr/bin/docker" > /etc/sudoers.d/deploy
  chmod 0440 /etc/sudoers.d/deploy
fi

mkdir -p /home/deploy/.ssh
echo "$SSH_PUBLIC_KEY" > /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

echo "=== [3/9] Configurando firewall (UFW) ==="
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "=== [4/9] Instalando Docker ==="
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
usermod -aG docker deploy

# Docker Compose plugin (instalado com Docker Engine moderno)
docker compose version || {
  echo "ERRO: Docker Compose plugin nao instalado"
  exit 1
}

echo "=== [5/9] Configurando log rotation do Docker ==="
cat > /etc/docker/daemon.json <<'DAEMON'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 65536,
      "Soft": 65536
    }
  }
}
DAEMON
systemctl restart docker

echo "=== [6/9] Criando swap de 2GB ==="
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
  # Otimizar swappiness para servidor
  echo "vm.swappiness=10" >> /etc/sysctl.conf
  sysctl -p
fi

echo "=== [7/9] Criando Docker network edge_network ==="
docker network inspect edge_network &>/dev/null || docker network create edge_network

echo "=== [8/9] Criando estrutura de diretorios ==="
mkdir -p /opt/apps/caddy
mkdir -p /opt/apps/ln-educacional/{prod,test}
mkdir -p /opt/apps/sistema-financeiro/{prod,test}
chown -R deploy:deploy /opt/apps

echo "=== [9/9] Login no GHCR ==="
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GH_USER" --password-stdin

# Copiar credenciais do Docker para o usuario deploy
mkdir -p /home/deploy/.docker
cp /root/.docker/config.json /home/deploy/.docker/config.json 2>/dev/null || true
chown -R deploy:deploy /home/deploy/.docker

echo ""
echo "============================================"
echo "  Provisao concluida com sucesso!"
echo "============================================"
echo ""
echo "Proximos passos:"
echo "  1. Copiar Caddyfile e docker-compose.yml para /opt/apps/caddy/"
echo "  2. Copiar docker-compose.yml e .env para cada app em /opt/apps/"
echo "  3. Configurar DNS apontando para este servidor"
echo "  4. Iniciar Caddy: cd /opt/apps/caddy && docker compose up -d"
echo "  5. Iniciar apps: cd /opt/apps/<app>/<env> && docker compose up -d"
echo ""
