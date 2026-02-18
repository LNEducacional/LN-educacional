# Guia Completo de Deploy - LN Educacional

> Guia detalhado para montar a infraestrutura em uma VPS e configurar CI/CD com GitHub Actions.

---

## Sumario

1. [Visao Geral da Arquitetura](#1-visao-geral-da-arquitetura)
2. [Requisitos da VPS](#2-requisitos-da-vps)
3. [Configuracao Inicial da VPS](#3-configuracao-inicial-da-vps)
4. [DNS e Dominios](#4-dns-e-dominios)
5. [Variaveis de Ambiente](#5-variaveis-de-ambiente)
6. [Estrutura dos Containers Docker](#6-estrutura-dos-containers-docker)
7. [Deploy Manual (Primeiro Deploy)](#7-deploy-manual-primeiro-deploy)
8. [SSL/TLS com Let's Encrypt](#8-ssltls-com-lets-encrypt)
9. [CI/CD com GitHub Actions](#9-cicd-com-github-actions)
10. [Monitoramento e Logs](#10-monitoramento-e-logs)
11. [Backup e Restauracao](#11-backup-e-restauracao)
12. [Troubleshooting](#12-troubleshooting)
13. [Comandos Uteis](#13-comandos-uteis)
14. [Checklist de Deploy](#14-checklist-de-deploy)

---

## 1. Visao Geral da Arquitetura

### Stack Tecnologico

| Componente | Tecnologia | Versao |
|-----------|-----------|--------|
| **Frontend** | React 19 + Vite + TailwindCSS | 2.0.0 |
| **Backend** | Fastify + TypeScript | 4.26.2 |
| **Banco de Dados** | PostgreSQL | 16-alpine |
| **Cache** | Redis | 7-alpine |
| **ORM** | Prisma | 5.11.0 |
| **Reverse Proxy** | Nginx | alpine |
| **SSL** | Certbot (Let's Encrypt) | latest |
| **Runtime** | Node.js | >= 20.0.0 |
| **Orquestracao** | Docker Compose | 3.8 |

### Diagrama de Rede

```
Internet
    |
    v
[Nginx :80/:443]  (reverse proxy + SSL termination)
    |
    +---> [Client :80]       (React SPA servido por Nginx interno)
    |         dominio: lneducacional.com.br / www.lneducacional.com.br
    |
    +---> [Server :3333]     (API Fastify)
    |         dominio: api.lneducacional.com.br
    |         |
    |         +---> [PostgreSQL :5432]  (banco de dados)
    |         |
    |         +---> [Redis :6379]       (cache)
    |
    +---> [Certbot]          (renovacao automatica SSL)
```

### Portas Utilizadas

| Porta | Servico | Acesso |
|-------|---------|--------|
| 80 | Nginx (HTTP -> redirect HTTPS) | Publico |
| 443 | Nginx (HTTPS) | Publico |
| 3000 | Client (mapeado para Nginx interno :80) | Interno* |
| 3333 | Server API | Interno* |
| 5432 | PostgreSQL | Interno* |
| 6379 | Redis | Interno* |

> *Interno: acessivel apenas na rede Docker `ln-network`. As portas sao expostas ao host para debug, mas em producao recomenda-se remover os mapeamentos de porta de postgres, redis e server do `docker-compose.yaml`.

### Volumes Docker

| Volume | Container | Caminho | Descricao |
|--------|-----------|---------|-----------|
| `postgres_data` | postgres | `/var/lib/postgresql/data` | Dados do banco |
| `redis_data` | redis | `/data` | Cache persistente |
| `uploads_data` | server | `/app/uploads` | Arquivos enviados pelos usuarios |

---

## 2. Requisitos da VPS

### Especificacoes Minimas

| Recurso | Minimo | Recomendado |
|---------|--------|-------------|
| **CPU** | 2 vCPUs | 4 vCPUs |
| **RAM** | 2 GB | 4 GB |
| **Disco** | 40 GB SSD | 80 GB SSD |
| **SO** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| **Banda** | 1 TB/mes | 2 TB/mes |

### Provedores Compatíveis

- **Hetzner** (recomendado para custo-beneficio)
- **DigitalOcean**
- **Vultr**
- **Contabo**
- **AWS EC2 / Lightsail**

### Software Necessario na VPS

- Docker Engine >= 24.0
- Docker Compose >= 2.20
- Git >= 2.30
- UFW (firewall)
- fail2ban (protecao contra brute-force)

---

## 3. Configuracao Inicial da VPS

### 3.1. Acesso SSH e Usuario

```bash
# Conectar a VPS (substitua pelo seu IP)
ssh root@SEU_IP_VPS

# Criar usuario de deploy (nao usar root em producao)
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Configurar SSH key (na sua maquina local)
ssh-copy-id deploy@SEU_IP_VPS

# Desabilitar login por senha (opcional, recomendado)
sudo nano /etc/ssh/sshd_config
# Alterar: PasswordAuthentication no
sudo systemctl restart sshd
```

### 3.2. Firewall (UFW)

```bash
# Configurar firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
sudo ufw status
```

### 3.3. Instalar Docker e Docker Compose

```bash
# Remover versoes antigas
sudo apt-get remove docker docker-engine docker.io containerd runc

# Instalar dependencias
sudo apt-get update
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Adicionar chave GPG oficial do Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Adicionar repositorio
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine + Compose Plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verificar instalacao
docker --version
docker compose version

# Permitir usar docker sem sudo
sudo usermod -aG docker deploy
newgrp docker
```

### 3.4. Instalar fail2ban

```bash
sudo apt-get install -y fail2ban

# Criar configuracao local
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

Adicionar ao arquivo `/etc/fail2ban/jail.local`:

```ini
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3.5. Configurar Swap (se RAM limitada)

```bash
# Criar arquivo de swap de 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Ajustar swappiness
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## 4. DNS e Dominios

### Registros DNS Necessarios

Configurar os seguintes registros no seu provedor de DNS (Cloudflare, Route53, etc.):

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | `lneducacional.com.br` | `SEU_IP_VPS` | 300 |
| A | `www.lneducacional.com.br` | `SEU_IP_VPS` | 300 |
| A | `api.lneducacional.com.br` | `SEU_IP_VPS` | 300 |

> **Importante:** Se usar Cloudflare com proxy (nuvem laranja), desabilite o proxy durante a emissao inicial do certificado SSL. Apos o certbot funcionar, pode reativar.

### Verificar propagacao DNS

```bash
# Verificar se o DNS esta apontando corretamente
dig lneducacional.com.br +short
dig www.lneducacional.com.br +short
dig api.lneducacional.com.br +short

# Todos devem retornar o IP da VPS
```

---

## 5. Variaveis de Ambiente

### 5.1. Arquivo `.env` na Raiz do Projeto (VPS)

Criar o arquivo `.env` no diretorio do projeto na VPS:

```bash
nano /home/deploy/ln-educacional/.env
```

```env
# ====================================================
# BANCO DE DADOS
# ====================================================
POSTGRES_DB=ln_educacional
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI_MIN_32_CHARS
POSTGRES_PORT=5432

# ====================================================
# REDIS
# ====================================================
REDIS_PORT=6379

# ====================================================
# SERVIDOR (API)
# ====================================================
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
SERVER_PORT=3333

# ====================================================
# AUTENTICACAO (OBRIGATORIO - gerar valores unicos!)
# ====================================================
# Gerar com: openssl rand -base64 64
JWT_SECRET=GERAR_COM_OPENSSL_RAND_BASE64_64
JWT_REFRESH_SECRET=GERAR_COM_OPENSSL_RAND_BASE64_64
COOKIE_SECRET=GERAR_COM_OPENSSL_RAND_BASE64_64

# ====================================================
# CORS E URLs
# ====================================================
CORS_ORIGIN=https://lneducacional.com.br,https://www.lneducacional.com.br
FRONTEND_URL=https://lneducacional.com.br

# ====================================================
# CLIENTE (BUILD-TIME)
# ====================================================
VITE_API_URL=https://api.lneducacional.com.br
CLIENT_PORT=3000

# ====================================================
# EMAIL
# ====================================================
EMAIL_PROVIDER=console
# Opcoes: console (dev), sendgrid, resend, nodemailer
EMAIL_API_KEY=
EMAIL_FROM=noreply@lneducacional.com.br
EMAIL_FROM_NAME=LN Educacional
EMAIL_REPLY_TO=contato@lneducacional.com.br
ADMIN_EMAIL=admin@lneducacional.com.br

# Para nodemailer (SMTP):
# SMTP_HOST=smtp.seuservidor.com
# SMTP_PORT=587
# SMTP_USER=usuario
# SMTP_PASS=senha

# ====================================================
# NOTIFICACOES (OPCIONAIS)
# ====================================================
# DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
# SLACK_WEBHOOK=https://hooks.slack.com/services/...
# REALTIME_NOTIFICATIONS=true

# ====================================================
# PAGAMENTO (ASAAS)
# ====================================================
# ASAAS_API_KEY=sua_chave_api_asaas
# ASAAS_ENVIRONMENT=production

# ====================================================
# ANTI-SPAM (OPCIONAIS - valores padrao funcionam)
# ====================================================
# ANTI_SPAM_ENABLED=true
# RATE_LIMIT_MAX=5
# RATE_LIMIT_WINDOW=900000
# RATE_LIMIT_BLOCK_DURATION=3600000

# ====================================================
# AUTO-REPLY (OPCIONAIS)
# ====================================================
# AUTO_REPLY_ENABLED=true
# AUTO_REPLY_DELAY=2000

# ====================================================
# SEGURANCA (OPCIONAIS)
# ====================================================
# BLOCKED_IPS=1.2.3.4,5.6.7.8
# CDN_URL=https://cdn.lneducacional.com.br
```

### 5.2. Gerar Secrets Seguros

```bash
# Executar na VPS para gerar cada secret
openssl rand -base64 64

# Exemplo de output (use valores diferentes para cada variavel):
# JWT_SECRET=aB3xY7...longo...==
# JWT_REFRESH_SECRET=kL9mN2...longo...==
# COOKIE_SECRET=pQ5rS8...longo...==
# POSTGRES_PASSWORD=wE4tU1...longo...==
```

### 5.3. Proteger o Arquivo `.env`

```bash
chmod 600 /home/deploy/ln-educacional/.env
chown deploy:deploy /home/deploy/ln-educacional/.env
```

### 5.4. Tabela Completa de Variaveis

| Variavel | Obrigatoria | Default | Descricao |
|----------|-------------|---------|-----------|
| `POSTGRES_DB` | Sim | `ln_educacional` | Nome do banco |
| `POSTGRES_USER` | Sim | `postgres` | Usuario do banco |
| `POSTGRES_PASSWORD` | **Sim** | `secret` | Senha do banco (trocar!) |
| `POSTGRES_PORT` | Nao | `5432` | Porta do PostgreSQL |
| `REDIS_PORT` | Nao | `6379` | Porta do Redis |
| `NODE_ENV` | Sim | `production` | Ambiente |
| `PORT` | Nao | `3333` | Porta da API |
| `HOST` | Nao | `0.0.0.0` | Host da API |
| `SERVER_PORT` | Nao | `3333` | Porta exposta do server |
| `CLIENT_PORT` | Nao | `3000` | Porta exposta do client |
| `JWT_SECRET` | **Sim** | - | Secret JWT (gerar!) |
| `JWT_REFRESH_SECRET` | **Sim** | - | Secret refresh token (gerar!) |
| `COOKIE_SECRET` | **Sim** | - | Secret de cookies (gerar!) |
| `CORS_ORIGIN` | Sim | `https://lneducacional.com.br` | Origens CORS permitidas |
| `FRONTEND_URL` | Sim | - | URL do frontend para links em emails |
| `VITE_API_URL` | Sim | `https://api.lneducacional.com.br` | URL da API (build-time) |
| `EMAIL_PROVIDER` | Nao | `console` | Provider de email |
| `EMAIL_API_KEY` | Condicional | - | API key do provider de email |
| `EMAIL_FROM` | Nao | `noreply@lneducacional.com.br` | Remetente dos emails |
| `EMAIL_FROM_NAME` | Nao | `LN Educacional` | Nome do remetente |
| `EMAIL_REPLY_TO` | Nao | `contato@lneducacional.com.br` | Email de resposta |
| `ADMIN_EMAIL` | Nao | `admin@lneducacional.com.br` | Email do admin |
| `DISCORD_WEBHOOK` | Nao | - | Webhook Discord |
| `SLACK_WEBHOOK` | Nao | - | Webhook Slack |
| `ASAAS_API_KEY` | Condicional | - | Chave da API Asaas (pagamentos) |

---

## 6. Estrutura dos Containers Docker

### 6.1. Dockerfile.server (Multi-stage)

```
Stage 1 (deps):     Node 20-alpine  -> Instala dependencias (npm ci --workspace=server)
Stage 2 (builder):  Node 20-alpine  -> Gera Prisma Client + Compila TypeScript
Stage 3 (runner):   Node 20-alpine  -> Imagem final com dumb-init, usuario nao-root (fastify:1001)
```

**Fluxo de inicializacao do server:**
1. `dumb-init` inicia (tratamento correto de sinais SIGTERM/SIGINT)
2. `prisma migrate deploy` executa migrations pendentes
3. `node server/dist/index.js` inicia o Fastify na porta 3333

### 6.2. Dockerfile.client (Multi-stage)

```
Stage 1 (deps):     Node 20-alpine  -> Instala dependencias (npm ci --workspace=client)
Stage 2 (builder):  Node 20-alpine  -> Vite build com VITE_API_URL injetada
Stage 3 (runner):   Nginx alpine    -> Serve SPA com fallback para index.html
```

**Build arg:** `VITE_API_URL` e injetada em tempo de build (nao pode ser alterada em runtime).

### 6.3. Nginx Reverse Proxy

O container Nginx principal atua como:
- **Terminacao SSL** (certificados Let's Encrypt)
- **Reverse proxy** para client e server
- **Rate limiting** (30 req/s API geral, 5 req/min auth)
- **Compressao gzip**
- **Headers de seguranca** (HSTS, CSP, X-Frame-Options)
- **Cache** de arquivos estaticos

### 6.4. Ordem de Inicializacao

```
1. PostgreSQL  (healthcheck: pg_isready, 10s interval, 5 retries)
2. Redis       (healthcheck: redis-cli ping, 10s interval, 5 retries)
3. Server      (depende de postgres + redis healthy)
4. Client      (depende de server)
5. Nginx       (depende de client + server)
6. Certbot     (independente, loop de renovacao a cada 12h)
```

### 6.5. Rede Interna

Todos os containers estao na rede bridge `ln-network`. A comunicacao interna usa os nomes dos servicos como hostname:
- `postgres:5432`
- `redis:6379`
- `server:3333`
- `client:80`

---

## 7. Deploy Manual (Primeiro Deploy)

### 7.1. Clonar Repositorio na VPS

```bash
# Logar como deploy
ssh deploy@SEU_IP_VPS

# Clonar o repositorio
cd /home/deploy
git clone https://github.com/SEU_USUARIO/ln-educacional.git
cd ln-educacional
```

### 7.2. Criar o Arquivo `.env`

```bash
# Copiar e editar o .env (veja secao 5.1 acima)
nano .env
# Preencher TODAS as variaveis obrigatorias
```

### 7.3. Primeiro Build e Deploy

```bash
# Build de todos os containers
docker compose build --no-cache

# Subir em modo detached
docker compose up -d

# Verificar se todos os containers estao rodando
docker compose ps

# Verificar logs de todos os servicos
docker compose logs -f
```

### 7.4. Verificar Health Checks

```bash
# Health check da API
curl http://localhost:3333/health

# Resposta esperada:
# {
#   "status": "ok",
#   "database": { "status": "connected" },
#   "redis": { "status": "connected" },
#   "memory": { "used": ..., "total": ... },
#   "uptime": ...
# }

# Readiness probe
curl http://localhost:3333/ready

# Liveness probe
curl http://localhost:3333/live
```

### 7.5. Seed do Banco de Dados (Opcional)

O seed cria usuarios padrao para teste. Execute apenas se necessario:

```bash
# Entrar no container do server
docker compose exec server sh

# Executar seed (dentro do container)
npx tsx server/src/seed.ts

# Usuarios criados:
# Admin:   admin@lneducacional.com / admin123
# Aluno:   aluno@lneducacional.com / aluno123
```

> **IMPORTANTE:** Troque as senhas dos usuarios seed imediatamente apos o primeiro login.

---

## 8. SSL/TLS com Let's Encrypt

### 8.1. Emitir Certificados pela Primeira Vez

Na primeira vez, o Nginx nao vai iniciar porque os certificados ainda nao existem. Siga este processo:

```bash
# 1. Parar o nginx (se estiver rodando)
docker compose stop nginx

# 2. Criar diretorios para certificados
mkdir -p certbot/conf certbot/www

# 3. Emitir certificados com certbot standalone
docker run --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email SEU_EMAIL@dominio.com \
    -d lneducacional.com.br \
    -d www.lneducacional.com.br \
    -d api.lneducacional.com.br

# 4. Verificar se os certificados foram criados
ls certbot/conf/live/lneducacional.com.br/
# Deve listar: fullchain.pem  privkey.pem  cert.pem  chain.pem

# 5. Subir todos os servicos novamente
docker compose up -d
```

### 8.2. Renovacao Automatica

O container `certbot` no `docker-compose.yaml` ja esta configurado para renovar automaticamente a cada 12 horas:

```yaml
entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
```

Para forcar renovacao manual:

```bash
docker compose exec certbot certbot renew --force-renewal
docker compose exec nginx nginx -s reload
```

### 8.3. Alternativa: Sem SSL (Ambiente de Staging)

Se quiser subir sem SSL para testes, crie uma configuracao Nginx simplificada:

```bash
# Criar um nginx/conf.d/default.conf temporario sem SSL
# que apenas faz proxy para client e server na porta 80
```

---

## 9. CI/CD com GitHub Actions

### 9.1. Criar o Workflow

Criar o arquivo `.github/workflows/deploy.yml` no repositorio:

```yaml
name: Deploy LN Educacional

on:
  push:
    branches: [master]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ghcr.io/${{ github.repository }}

jobs:
  # ========================================
  # Job 1: Lint e Typecheck
  # ========================================
  quality:
    name: Quality Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Instalar dependencias
        run: npm ci

      - name: Lint (Biome)
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

  # ========================================
  # Job 2: Build e Push das Imagens Docker
  # ========================================
  build:
    name: Build Docker Images
    runs-on: ubuntu-latest
    needs: quality
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Login no GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build e Push - Server
        uses: docker/build-push-action@v5
        with:
          context: .
          file: Dockerfile.server
          push: true
          tags: |
            ${{ env.IMAGE_PREFIX }}/server:latest
            ${{ env.IMAGE_PREFIX }}/server:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build e Push - Client
        uses: docker/build-push-action@v5
        with:
          context: .
          file: Dockerfile.client
          push: true
          tags: |
            ${{ env.IMAGE_PREFIX }}/client:latest
            ${{ env.IMAGE_PREFIX }}/client:${{ github.sha }}
          build-args: |
            VITE_API_URL=${{ secrets.VITE_API_URL }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ========================================
  # Job 3: Deploy na VPS via SSH
  # ========================================
  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest
    needs: build
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_SSH_PORT }}
          script: |
            cd /home/deploy/ln-educacional

            # Atualizar codigo fonte (configs nginx, docker-compose, etc.)
            git fetch origin master
            git reset --hard origin/master

            # Login no registry
            echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin

            # Pull das novas imagens
            docker pull ${{ env.IMAGE_PREFIX }}/server:latest
            docker pull ${{ env.IMAGE_PREFIX }}/client:latest

            # Atualizar docker-compose para usar imagens do registry
            # (ou fazer rebuild local - veja alternativa abaixo)
            docker compose up -d --force-recreate --no-build

            # Limpar imagens antigas
            docker image prune -af --filter "until=24h"

            # Verificar saude dos servicos
            sleep 10
            curl -sf http://localhost:3333/health || exit 1

      - name: Notificar sucesso (opcional)
        if: success()
        run: echo "Deploy realizado com sucesso!"

      - name: Notificar falha (opcional)
        if: failure()
        run: echo "Deploy falhou!"
```

### 9.2. Alternativa Simplificada (Build na VPS)

Se preferir nao usar registry de imagens e buildar diretamente na VPS:

```yaml
name: Deploy LN Educacional (Build na VPS)

on:
  push:
    branches: [master]
  workflow_dispatch:

jobs:
  quality:
    name: Quality Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest
    needs: quality
    environment: production
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_SSH_PORT }}
          script_stop: true
          script: |
            set -e

            cd /home/deploy/ln-educacional

            echo ">>> Atualizando codigo..."
            git fetch origin master
            git reset --hard origin/master

            echo ">>> Rebuilding containers..."
            docker compose build --no-cache server client

            echo ">>> Reiniciando servicos..."
            docker compose up -d --force-recreate

            echo ">>> Limpando imagens antigas..."
            docker image prune -af --filter "until=24h"

            echo ">>> Aguardando servicos..."
            sleep 15

            echo ">>> Verificando saude..."
            curl -sf http://localhost:3333/health || {
              echo "Health check falhou!"
              docker compose logs --tail=50 server
              exit 1
            }

            echo ">>> Deploy concluido com sucesso!"
```

### 9.3. Secrets do GitHub

Configurar em **Settings > Secrets and variables > Actions** no repositorio GitHub:

| Secret | Descricao | Exemplo |
|--------|-----------|---------|
| `VPS_HOST` | IP ou hostname da VPS | `123.456.789.0` |
| `VPS_USER` | Usuario SSH | `deploy` |
| `VPS_SSH_KEY` | Chave privada SSH (conteudo completo) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_SSH_PORT` | Porta SSH | `22` |
| `VITE_API_URL` | URL da API (para build do client) | `https://api.lneducacional.com.br` |
| `GITHUB_TOKEN` | Automatico (se usar GHCR) | Automatico |

### 9.4. Gerar Chave SSH para CI/CD

```bash
# Na sua maquina local
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key -N ""

# Copiar chave publica para a VPS
ssh-copy-id -i ~/.ssh/github_deploy_key.pub deploy@SEU_IP_VPS

# Copiar chave privada para o secret VPS_SSH_KEY no GitHub
cat ~/.ssh/github_deploy_key
# Copiar TODO o conteudo (incluindo BEGIN e END)
```

### 9.5. Deploy com Docker-Compose usando Registry (Ajuste)

Para usar imagens do GHCR no `docker-compose.yaml`, crie um `docker-compose.prod.yml` override:

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  server:
    image: ghcr.io/SEU_USUARIO/ln-educacional/server:latest
    build: !reset null

  client:
    image: ghcr.io/SEU_USUARIO/ln-educacional/client:latest
    build: !reset null
```

E no deploy:

```bash
docker compose -f docker-compose.yaml -f docker-compose.prod.yml up -d
```

### 9.6. Fluxo Completo do CI/CD

```
Developer faz push na branch master
    |
    v
GitHub Actions dispara workflow
    |
    +---> [Quality] Lint (Biome) + Typecheck
    |         |
    |         v  (passa)
    +---> [Build] Build imagens Docker + Push para GHCR
    |         |
    |         v  (passa)
    +---> [Deploy] SSH na VPS
              |
              +---> git pull
              +---> docker compose pull (ou build)
              +---> docker compose up -d
              +---> prisma migrate deploy (automatico no CMD)
              +---> health check (curl /health)
              |
              v
          Deploy concluido!
```

---

## 10. Monitoramento e Logs

### 10.1. Endpoints de Monitoramento

| Endpoint | Descricao | Uso |
|----------|-----------|-----|
| `GET /health` | Status completo (DB, Redis, memoria, uptime) | Monitoramento geral |
| `GET /ready` | Readiness (apenas DB) | Kubernetes/load balancer |
| `GET /live` | Liveness (sempre 200) | Kubernetes probes |

### 10.2. Logs dos Containers

```bash
# Ver logs de todos os servicos
docker compose logs -f

# Logs de um servico especifico
docker compose logs -f server
docker compose logs -f postgres
docker compose logs -f nginx
docker compose logs -f client

# Ultimas N linhas
docker compose logs --tail=100 server

# Logs com timestamp
docker compose logs -f -t server
```

### 10.3. Logs do Nginx

```bash
# Access log
docker compose exec nginx cat /var/log/nginx/access.log

# Error log
docker compose exec nginx cat /var/log/nginx/error.log

# Follow em tempo real
docker compose exec nginx tail -f /var/log/nginx/error.log
```

### 10.4. Monitoramento de Recursos

```bash
# Uso de recursos por container
docker stats

# Uso de disco dos volumes
docker system df -v

# Espaco total em disco
df -h
```

### 10.5. Configurar Logrotate para Docker

```bash
# Criar /etc/docker/daemon.json
sudo tee /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl restart docker
```

### 10.6. Monitoramento Externo (Opcional)

Servicos recomendados para monitoramento de uptime:

- **UptimeRobot** (gratuito) - Monitora `https://api.lneducacional.com.br/health`
- **Healthchecks.io** (gratuito) - Cron job monitoring
- **Grafana Cloud** (gratuito ate certo limite) - Metricas e dashboards

---

## 11. Backup e Restauracao

### 11.1. Backup do Banco de Dados

```bash
# Backup manual
docker compose exec postgres pg_dump -U postgres ln_educacional > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup comprimido
docker compose exec postgres pg_dump -U postgres ln_educacional | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 11.2. Script de Backup Automatico

Criar `/home/deploy/scripts/backup.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup..."

# Backup do banco
docker compose -f /home/deploy/ln-educacional/docker-compose.yaml \
  exec -T postgres pg_dump -U postgres ln_educacional | \
  gzip > "$BACKUP_DIR/db_${DATE}.sql.gz"

# Backup dos uploads
tar -czf "$BACKUP_DIR/uploads_${DATE}.tar.gz" \
  -C /var/lib/docker/volumes/ \
  ln-educacional_uploads_data

# Remover backups antigos
find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup concluido: db_${DATE}.sql.gz"
```

```bash
chmod +x /home/deploy/scripts/backup.sh
```

### 11.3. Cron para Backup Diario

```bash
crontab -e
```

Adicionar:

```
# Backup diario as 3h da manha
0 3 * * * /home/deploy/scripts/backup.sh >> /home/deploy/backups/backup.log 2>&1
```

### 11.4. Restaurar Backup

```bash
# Restaurar banco de dados
gunzip < backup_20260202_030000.sql.gz | \
  docker compose exec -T postgres psql -U postgres ln_educacional

# Restaurar uploads
cd /var/lib/docker/volumes/
sudo tar -xzf /home/deploy/backups/uploads_20260202_030000.tar.gz
```

### 11.5. Backup Remoto (Opcional)

Enviar backups para storage externo (S3, Backblaze B2, etc.):

```bash
# Exemplo com rclone (configurar previamente)
rclone copy /home/deploy/backups remote:ln-educacional-backups --max-age 7d
```

---

## 12. Troubleshooting

### 12.1. Container Nao Inicia

```bash
# Ver status de todos os containers
docker compose ps

# Ver logs do container com problema
docker compose logs --tail=50 server

# Recriar container especifico
docker compose up -d --force-recreate server
```

### 12.2. Banco de Dados Nao Conecta

```bash
# Verificar se o postgres esta saudavel
docker compose exec postgres pg_isready -U postgres

# Verificar logs do postgres
docker compose logs postgres

# Conectar ao banco manualmente
docker compose exec postgres psql -U postgres -d ln_educacional

# Verificar a connection string
docker compose exec server env | grep DATABASE_URL
```

### 12.3. Redis Nao Conecta

```bash
# Verificar se o redis esta respondendo
docker compose exec redis redis-cli ping
# Deve retornar: PONG

# Verificar uso de memoria do Redis
docker compose exec redis redis-cli info memory

# Limpar cache (se necessario)
docker compose exec redis redis-cli FLUSHALL
```

### 12.4. Migrations Falham

```bash
# Ver status das migrations
docker compose exec server npx prisma migrate status --schema=./server/prisma/schema.prisma

# Rodar migrations manualmente
docker compose exec server npx prisma migrate deploy --schema=./server/prisma/schema.prisma

# Se houver conflito, resetar (CUIDADO: apaga dados!)
# docker compose exec server npx prisma migrate reset --schema=./server/prisma/schema.prisma --force
```

### 12.5. Certificado SSL Expirado

```bash
# Verificar data de expiracao
docker compose exec nginx openssl s_client -connect localhost:443 -servername lneducacional.com.br 2>/dev/null | openssl x509 -noout -dates

# Forcar renovacao
docker compose exec certbot certbot renew --force-renewal

# Recarregar nginx
docker compose exec nginx nginx -s reload
```

### 12.6. Disco Cheio

```bash
# Verificar uso de disco
df -h

# Limpar imagens Docker nao utilizadas
docker image prune -af

# Limpar volumes nao utilizados (CUIDADO!)
# docker volume prune

# Limpar logs do Docker
sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log

# Limpar backups antigos
find /home/deploy/backups -name "*.gz" -mtime +7 -delete
```

### 12.7. Servico Lento / Alto Uso de Memoria

```bash
# Verificar recursos por container
docker stats --no-stream

# Reiniciar servico especifico sem downtime
docker compose up -d --force-recreate --no-deps server

# Verificar conexoes ativas no banco
docker compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

### 12.8. CORS Errors no Frontend

Verificar:
1. `CORS_ORIGIN` no `.env` inclui todos os dominios necessarios (com `https://`)
2. O cookie `domain` no server esta configurado corretamente (`.lneducacional.com.br` em producao)
3. O Nginx esta passando os headers corretos (`X-Forwarded-Proto`, `X-Real-IP`)

### 12.9. Uploads Nao Funcionam

```bash
# Verificar permissoes do volume de uploads
docker compose exec server ls -la /app/uploads/

# Verificar se o diretorio existe e tem permissao
docker compose exec server sh -c "mkdir -p /app/uploads && ls -la /app/uploads"

# Verificar limite de tamanho no Nginx (deve ser 50M)
docker compose exec nginx nginx -T | grep client_max_body_size
```

---

## 13. Comandos Uteis

### Gerenciamento de Containers

```bash
# Subir todos os servicos
docker compose up -d

# Parar todos os servicos
docker compose down

# Parar e remover volumes (CUIDADO: apaga dados!)
docker compose down -v

# Reiniciar um servico
docker compose restart server

# Reconstruir e reiniciar
docker compose up -d --build server

# Escalar servico (se configurado)
docker compose up -d --scale server=2

# Ver processos dentro de um container
docker compose top server
```

### Banco de Dados (Prisma)

```bash
# Gerar Prisma Client (dentro do container)
docker compose exec server npx prisma generate --schema=./server/prisma/schema.prisma

# Rodar migrations
docker compose exec server npx prisma migrate deploy --schema=./server/prisma/schema.prisma

# Abrir Prisma Studio (dev/debug)
docker compose exec server npx prisma studio --schema=./server/prisma/schema.prisma

# Ver schema atual
docker compose exec server npx prisma db pull --schema=./server/prisma/schema.prisma
```

### Debugging

```bash
# Entrar no shell de um container
docker compose exec server sh
docker compose exec postgres bash
docker compose exec nginx sh

# Verificar variaveis de ambiente
docker compose exec server env

# Testar conectividade interna
docker compose exec server sh -c "wget -qO- http://postgres:5432 || echo 'Porta 5432 acessivel'"
docker compose exec server sh -c "wget -qO- http://redis:6379 || echo 'Porta 6379 acessivel'"

# Verificar configuracao do Nginx
docker compose exec nginx nginx -t
docker compose exec nginx nginx -T
```

### Atualizacao de Codigo

```bash
# Deploy manual rapido
cd /home/deploy/ln-educacional
git pull origin master
docker compose build --no-cache server client
docker compose up -d --force-recreate server client
docker image prune -af
```

---

## 14. Checklist de Deploy

### Pre-Deploy

- [ ] VPS provisionada com Ubuntu 22.04+ LTS
- [ ] Docker e Docker Compose instalados
- [ ] Firewall (UFW) configurado (portas 22, 80, 443)
- [ ] fail2ban instalado e configurado
- [ ] Usuario `deploy` criado e adicionado ao grupo `docker`
- [ ] Chave SSH configurada para acesso sem senha
- [ ] DNS configurado (A records para dominio, www e api)
- [ ] Propagacao DNS verificada (`dig` retorna IP correto)

### Configuracao

- [ ] Repositorio clonado em `/home/deploy/ln-educacional`
- [ ] Arquivo `.env` criado com todas as variaveis obrigatorias
- [ ] `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` gerados com `openssl rand -base64 64`
- [ ] `POSTGRES_PASSWORD` definido com senha forte
- [ ] `CORS_ORIGIN` configurado com dominios corretos
- [ ] `VITE_API_URL` apontando para `https://api.lneducacional.com.br`
- [ ] Permissoes do `.env` restritas (`chmod 600`)

### SSL/TLS

- [ ] Diretorios `certbot/conf` e `certbot/www` criados
- [ ] Certificados emitidos com sucesso para todos os dominios
- [ ] Nginx configurado com SSL e reiniciado
- [ ] HTTPS funcionando em `https://lneducacional.com.br`
- [ ] HTTPS funcionando em `https://api.lneducacional.com.br`
- [ ] HTTP redirecionando para HTTPS

### Primeiro Deploy

- [ ] `docker compose build --no-cache` executado sem erros
- [ ] `docker compose up -d` executado
- [ ] Todos os 6 containers rodando (`docker compose ps`)
- [ ] Health check respondendo (`curl http://localhost:3333/health`)
- [ ] Banco de dados conectado (status "connected" no health)
- [ ] Redis conectado (status "connected" no health)
- [ ] Migrations aplicadas com sucesso
- [ ] Frontend acessivel via browser
- [ ] API respondendo via `https://api.lneducacional.com.br/health`

### CI/CD

- [ ] Secrets configurados no GitHub (VPS_HOST, VPS_USER, VPS_SSH_KEY, etc.)
- [ ] Chave SSH de deploy gerada e copiada para VPS
- [ ] Workflow `.github/workflows/deploy.yml` criado e commitado
- [ ] Push de teste na branch `master` dispara o workflow
- [ ] Quality check (lint + typecheck) passando
- [ ] Build das imagens concluido
- [ ] Deploy via SSH executado com sucesso
- [ ] Health check pos-deploy passando

### Pos-Deploy

- [ ] Senhas padrao do seed alteradas (se seed foi executado)
- [ ] Email provider configurado (trocar `console` por provider real)
- [ ] Backup automatico configurado (cron)
- [ ] Monitoramento de uptime configurado (UptimeRobot ou similar)
- [ ] Logrotate do Docker configurado
- [ ] Testado fluxo completo: registro, login, navegacao, upload

### Seguranca

- [ ] Login por senha SSH desabilitado (usar apenas chave)
- [ ] Apenas portas 22, 80, 443 abertas no firewall
- [ ] fail2ban ativo para SSH e Nginx
- [ ] Secrets nao estao no repositorio (`.env` no `.gitignore`)
- [ ] Headers de seguranca presentes (verificar com `securityheaders.com`)
- [ ] Rate limiting funcional (testar com `ab` ou `wrk`)

---

## Apendice A: Estrutura de Arquivos Relevantes

```
ln-educacional/
├── .env                          # Variaveis de ambiente (NAO versionar!)
├── .github/
│   └── workflows/
│       └── deploy.yml            # Pipeline CI/CD
├── certbot/
│   ├── conf/                     # Certificados SSL (gerados pelo certbot)
│   └── www/                      # Challenge files do certbot
├── docker-compose.yaml           # Orquestracao de containers
├── docker-compose.prod.yml       # Override para producao (opcional)
├── Dockerfile.client             # Build do frontend (multi-stage)
├── Dockerfile.server             # Build do backend (multi-stage)
├── nginx/
│   ├── nginx.conf                # Config principal do Nginx
│   └── conf.d/
│       └── default.conf          # Virtual hosts (SSL, proxy)
├── client/                       # React 19 + Vite
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
├── server/                       # Fastify + Prisma
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma         # Schema do banco (30+ models)
│   └── src/
│       ├── index.ts              # Entry point (:3333)
│       ├── app.ts                # Plugins, middlewares, auth
│       ├── routes.ts             # Todas as rotas HTTP
│       ├── redis.ts              # Cache layer
│       └── services/
│           ├── asaas.service.ts  # Pagamentos
│           ├── email.service.ts  # Envio de emails
│           └── ...
├── uploads/                      # Arquivos de usuarios (volume Docker)
└── package.json                  # Monorepo (workspaces)
```

## Apendice B: Portas e Servicos Resumo

```
EXTERNO (Internet):
  :80   → Nginx HTTP  (redirect para HTTPS)
  :443  → Nginx HTTPS (frontend + API)

INTERNO (Docker network: ln-network):
  client:80     → Nginx SPA (React build)
  server:3333   → Fastify API
  postgres:5432 → PostgreSQL 16
  redis:6379    → Redis 7

HOST (debug, remover em producao):
  :3000 → client:80
  :3333 → server:3333
  :5432 → postgres:5432
  :6379 → redis:6379
```

## Apendice C: Comandos de Emergencia

```bash
# Reiniciar tudo do zero (sem perder dados)
docker compose down && docker compose up -d

# Reiniciar tudo do zero (APAGA TODOS OS DADOS!)
docker compose down -v && docker compose up -d --build

# Ver o que esta consumindo disco
docker system df -v
du -sh /var/lib/docker/volumes/*

# Backup de emergencia do banco
docker compose exec -T postgres pg_dumpall -U postgres > emergency_backup.sql

# Restaurar backup de emergencia
docker compose exec -T postgres psql -U postgres < emergency_backup.sql

# Forcar rebuild completo
docker compose build --no-cache && docker compose up -d --force-recreate
```
