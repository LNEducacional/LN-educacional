#!/bin/bash

# LN Educacional - Deploy Script
# Automated deployment script with health checks and rollback capability

set -e  # Exit on any error

# Configuration
PROJECT_NAME="ln-educacional"
DEPLOY_USER="deploy"
DEPLOY_PATH="/var/www/ln-educacional"
BACKUP_PATH="/var/backups/ln-educacional"
LOG_FILE="/var/log/deploy-ln-educacional.log"
HEALTH_CHECK_URL="http://localhost:3333/health"
HEALTH_CHECK_TIMEOUT=30
MAX_DEPLOY_TIME=600  # 10 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case $level in
        INFO)  echo -e "${BLUE}[INFO]${NC} $message" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} $message" ;;
        SUCCESS) echo -e "${GREEN}[SUCCESS]${NC} $message" ;;
    esac

    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Check if running as root
check_privileges() {
    if [[ $EUID -eq 0 ]]; then
        log ERROR "This script should not be run as root"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log INFO "Checking prerequisites..."

    local missing_deps=()

    # Check if git is installed
    if ! command -v git >/dev/null 2>&1; then
        missing_deps+=("git")
    fi

    # Check if node is installed
    if ! command -v node >/dev/null 2>&1; then
        missing_deps+=("node")
    fi

    # Check if npm is installed
    if ! command -v npm >/dev/null 2>&1; then
        missing_deps+=("npm")
    fi

    # Check if pm2 is installed
    if ! command -v pm2 >/dev/null 2>&1; then
        missing_deps+=("pm2")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log ERROR "Missing dependencies: ${missing_deps[*]}"
        exit 1
    fi

    log SUCCESS "All prerequisites met"
}

# Create backup
create_backup() {
    log INFO "Creating backup..."

    local backup_dir="$BACKUP_PATH/$(date +%Y%m%d_%H%M%S)"

    # Create backup directory
    sudo mkdir -p "$backup_dir"

    # Backup current deployment if exists
    if [ -d "$DEPLOY_PATH" ]; then
        sudo cp -r "$DEPLOY_PATH" "$backup_dir/"
        log SUCCESS "Backup created at $backup_dir"
        echo "$backup_dir" > /tmp/last_backup_path
    else
        log WARN "No existing deployment to backup"
    fi
}

# Get latest code
update_code() {
    log INFO "Updating code from repository..."

    cd "$DEPLOY_PATH"

    # Fetch latest changes
    git fetch origin

    # Get current branch/commit for potential rollback
    local current_commit=$(git rev-parse HEAD)
    echo "$current_commit" > /tmp/previous_commit

    # Pull latest changes
    git pull origin main

    log SUCCESS "Code updated successfully"
}

# Install dependencies
install_dependencies() {
    log INFO "Installing dependencies..."

    cd "$DEPLOY_PATH"

    # Clean install
    rm -rf node_modules package-lock.json
    npm ci --production=false

    # Install dependencies for both client and server
    cd server && npm ci --production=false && cd ..
    cd client && npm ci --production=false && cd ..

    log SUCCESS "Dependencies installed"
}

# Build application
build_application() {
    log INFO "Building application..."

    cd "$DEPLOY_PATH"

    # Generate Prisma client
    npm run prisma:generate

    # Build server
    log INFO "Building server..."
    npm run build:server

    # Build client
    log INFO "Building client..."
    npm run build:client

    log SUCCESS "Application built successfully"
}

# Run database migrations
run_migrations() {
    log INFO "Running database migrations..."

    cd "$DEPLOY_PATH"

    # Run migrations
    npm run prisma:migrate

    log SUCCESS "Database migrations completed"
}

# Health check function
health_check() {
    log INFO "Performing health check..."

    local attempts=0
    local max_attempts=10

    while [ $attempts -lt $max_attempts ]; do
        if curl -f -s "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
            log SUCCESS "Health check passed"
            return 0
        fi

        log WARN "Health check failed, attempt $((attempts + 1))/$max_attempts"
        sleep 3
        attempts=$((attempts + 1))
    done

    log ERROR "Health check failed after $max_attempts attempts"
    return 1
}

# Start application
start_application() {
    log INFO "Starting application..."

    cd "$DEPLOY_PATH"

    # Stop existing processes
    pm2 stop ecosystem.config.cjs || true

    # Start with new configuration
    pm2 start ecosystem.config.cjs --env production

    # Save PM2 configuration
    pm2 save

    log SUCCESS "Application started"
}

# Rollback function
rollback() {
    log ERROR "Deployment failed, initiating rollback..."

    # Stop current processes
    pm2 stop ecosystem.config.cjs || true

    # Restore from backup
    if [ -f /tmp/last_backup_path ]; then
        local backup_path=$(cat /tmp/last_backup_path)
        if [ -d "$backup_path" ]; then
            sudo rm -rf "$DEPLOY_PATH"
            sudo cp -r "$backup_path/$(basename $DEPLOY_PATH)" "$DEPLOY_PATH"
            sudo chown -R $USER:$USER "$DEPLOY_PATH"
            log INFO "Restored from backup: $backup_path"
        fi
    fi

    # Rollback to previous commit
    if [ -f /tmp/previous_commit ]; then
        local previous_commit=$(cat /tmp/previous_commit)
        cd "$DEPLOY_PATH"
        git reset --hard "$previous_commit"
        log INFO "Rolled back to commit: $previous_commit"
    fi

    # Try to start the application
    pm2 start ecosystem.config.cjs --env production || true

    log ERROR "Rollback completed"
    exit 1
}

# Cleanup function
cleanup() {
    log INFO "Cleaning up..."

    # Remove temporary files
    rm -f /tmp/last_backup_path /tmp/previous_commit

    # Clean old backups (keep last 5)
    if [ -d "$BACKUP_PATH" ]; then
        cd "$BACKUP_PATH"
        ls -t | tail -n +6 | xargs -r rm -rf
        log INFO "Cleaned old backups"
    fi

    log SUCCESS "Cleanup completed"
}

# Send notification (placeholder for integration with Slack, Discord, etc.)
send_notification() {
    local status=$1
    local message=$2

    # Example webhook notification (replace with your webhook URL)
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"[$PROJECT_NAME] Deploy $status: $message\"}" \
    #     YOUR_WEBHOOK_URL

    log INFO "Notification sent: Deploy $status"
}

# Main deployment function
deploy() {
    local start_time=$(date +%s)

    log INFO "Starting deployment of $PROJECT_NAME..."

    # Set trap for cleanup on exit
    trap 'cleanup' EXIT
    trap 'rollback' ERR

    # Pre-deployment checks
    check_privileges
    check_prerequisites

    # Create backup
    create_backup

    # Update code
    update_code

    # Install dependencies
    install_dependencies

    # Build application
    build_application

    # Run database migrations
    run_migrations

    # Start application
    start_application

    # Wait a moment for application to start
    sleep 5

    # Health check
    if ! health_check; then
        rollback
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log SUCCESS "Deployment completed successfully in ${duration}s"
    send_notification "SUCCESS" "Deployment completed in ${duration}s"
}

# Script options
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    rollback)
        log INFO "Manual rollback requested"
        rollback
        ;;
    health-check)
        health_check
        ;;
    backup)
        create_backup
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health-check|backup}"
        exit 1
        ;;
esac