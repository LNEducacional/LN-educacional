#!/bin/bash

# LN Educacional - Monitoring Setup Script
# Sets up comprehensive monitoring, logging, and alerting

set -e

# Configuration
PROJECT_NAME="ln-educacional"
PROJECT_PATH="/var/www/ln-educacional"
LOG_DIR="/var/log"
SYSTEMD_DIR="/etc/systemd/system"
CRON_DIR="/etc/cron.d"

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
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log ERROR "This script must be run as root"
        exit 1
    fi
}

# Install required packages
install_dependencies() {
    log INFO "Installing monitoring dependencies..."

    # Update package list
    apt-get update -qq

    # Install essential monitoring tools
    apt-get install -y \
        htop \
        iotop \
        nethogs \
        curl \
        wget \
        jq \
        bc \
        mailutils \
        logrotate \
        rsyslog \
        cron

    log SUCCESS "Dependencies installed"
}

# Setup log directories and permissions
setup_logging() {
    log INFO "Setting up logging infrastructure..."

    # Create log directories
    mkdir -p "$LOG_DIR/ln-educacional"
    mkdir -p "$PROJECT_PATH/logs"

    # Set proper permissions
    chown -R www-data:www-data "$PROJECT_PATH/logs"
    chmod 755 "$PROJECT_PATH/logs"

    # Create rsyslog configuration for the application
    cat > /etc/rsyslog.d/50-ln-educacional.conf << EOF
# LN Educacional application logs
:programname,isequal,"ln-educacional" $LOG_DIR/ln-educacional/application.log
& stop

# PM2 logs
:programname,isequal,"PM2" $LOG_DIR/ln-educacional/pm2.log
& stop
EOF

    # Restart rsyslog
    systemctl restart rsyslog

    log SUCCESS "Logging configured"
}

# Setup log rotation
setup_logrotate() {
    log INFO "Configuring log rotation..."

    cat > /etc/logrotate.d/ln-educacional << EOF
$PROJECT_PATH/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        /usr/bin/pm2 reloadLogs
    endscript
}

$LOG_DIR/ln-educacional/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}

/var/log/nginx/lneducacional_*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        /usr/bin/nginx -s reload
    endscript
}
EOF

    log SUCCESS "Log rotation configured"
}

# Setup systemd service for monitoring
setup_monitoring_service() {
    log INFO "Creating monitoring systemd service..."

    cat > "$SYSTEMD_DIR/ln-monitoring.service" << EOF
[Unit]
Description=LN Educacional Monitoring Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_PATH
ExecStart=/bin/bash $PROJECT_PATH/scripts/monitoring.sh monitor 60
Restart=always
RestartSec=10

# Environment
Environment=NODE_ENV=production
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Logging
StandardOutput=append:$LOG_DIR/ln-educacional/monitoring.log
StandardError=append:$LOG_DIR/ln-educacional/monitoring-error.log

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

    # Make scripts executable
    chmod +x "$PROJECT_PATH/scripts/monitoring.sh"
    chmod +x "$PROJECT_PATH/scripts/deploy.sh"

    # Enable and start the service
    systemctl daemon-reload
    systemctl enable ln-monitoring.service

    log SUCCESS "Monitoring service created"
}

# Setup cron jobs
setup_cron_jobs() {
    log INFO "Setting up cron jobs for maintenance..."

    cat > "$CRON_DIR/ln-educacional" << EOF
# LN Educacional maintenance jobs

# Health check every 5 minutes
*/5 * * * * www-data $PROJECT_PATH/scripts/monitoring.sh health >> $LOG_DIR/ln-educacional/health-check.log 2>&1

# Generate metrics every minute
* * * * * www-data $PROJECT_PATH/scripts/monitoring.sh metrics >> $LOG_DIR/ln-educacional/metrics.log 2>&1

# Cleanup old logs daily at 2 AM
0 2 * * * root $PROJECT_PATH/scripts/monitoring.sh cleanup >> $LOG_DIR/ln-educacional/cleanup.log 2>&1

# Backup database daily at 3 AM
0 3 * * * www-data /usr/bin/pg_dump \$DATABASE_URL > /var/backups/ln-educacional/db-backup-\$(date +\%Y\%m\%d).sql 2>> $LOG_DIR/ln-educacional/backup.log

# Clean old backups weekly (keep 30 days)
0 4 * * 0 root find /var/backups/ln-educacional -name "*.sql" -mtime +30 -delete

# Update SSL certificates monthly (if using Let's Encrypt)
0 5 1 * * root /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

    # Restart cron
    systemctl restart cron

    log SUCCESS "Cron jobs configured"
}

# Setup backup directories
setup_backup_directories() {
    log INFO "Setting up backup directories..."

    mkdir -p /var/backups/ln-educacional
    chown www-data:www-data /var/backups/ln-educacional
    chmod 750 /var/backups/ln-educacional

    log SUCCESS "Backup directories created"
}

# Install and configure fail2ban
setup_fail2ban() {
    log INFO "Setting up fail2ban for security..."

    # Install fail2ban
    apt-get install -y fail2ban

    # Create custom jail for nginx
    cat > /etc/fail2ban/jail.d/ln-educacional.conf << EOF
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/lneducacional_error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/lneducacional_error.log
maxretry = 10

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/lneducacional_access.log
maxretry = 2
EOF

    # Restart fail2ban
    systemctl restart fail2ban
    systemctl enable fail2ban

    log SUCCESS "Fail2ban configured"
}

# Setup monitoring dashboard data
setup_monitoring_dashboard() {
    log INFO "Setting up monitoring dashboard data..."

    # Create directory for monitoring data
    mkdir -p /var/lib/ln-monitoring
    chown www-data:www-data /var/lib/ln-monitoring

    # Create simple monitoring dashboard HTML
    cat > /var/lib/ln-monitoring/dashboard.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>LN Educacional - Monitoring Dashboard</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; border-radius: 8px; padding: 20px; margin: 10px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status { display: inline-block; padding: 5px 10px; border-radius: 20px; color: white; font-weight: bold; }
        .status.ok { background: #28a745; }
        .status.warn { background: #ffc107; color: black; }
        .status.error { background: #dc3545; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .metric { text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #333; }
        .metric-label { color: #666; margin-top: 5px; }
        .refresh { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <h1>LN Educacional - System Monitoring</h1>

        <div class="card">
            <h2>System Status</h2>
            <div id="status-info">Loading...</div>
        </div>

        <div class="card">
            <h2>System Metrics</h2>
            <div class="metrics" id="metrics-info">Loading...</div>
        </div>

        <div class="card">
            <button class="refresh" onclick="loadData()">Refresh Data</button>
            <small style="float: right; color: #666;">Last updated: <span id="last-updated">-</span></small>
        </div>
    </div>

    <script>
        async function loadData() {
            try {
                // Load health status
                const healthResponse = await fetch('/api/health');
                const healthData = await healthResponse.json();

                let statusHtml = `<span class="status ${healthData.status === 'ok' ? 'ok' : 'error'}">${healthData.status.toUpperCase()}</span>`;
                statusHtml += `<p>Environment: ${healthData.environment}</p>`;
                statusHtml += `<p>Uptime: ${healthData.uptime} seconds</p>`;
                statusHtml += `<p>Database: ${healthData.database.status}</p>`;
                statusHtml += `<p>Redis: ${healthData.redis.status}</p>`;

                document.getElementById('status-info').innerHTML = statusHtml;

                // Load metrics
                let metricsHtml = `
                    <div class="metric">
                        <div class="metric-value">${healthData.memory.used}MB</div>
                        <div class="metric-label">Memory Used</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${healthData.memory.total}MB</div>
                        <div class="metric-label">Memory Total</div>
                    </div>
                `;

                document.getElementById('metrics-info').innerHTML = metricsHtml;
                document.getElementById('last-updated').textContent = new Date().toLocaleString();

            } catch (error) {
                document.getElementById('status-info').innerHTML = '<span class="status error">ERROR</span><p>Failed to load status</p>';
                document.getElementById('metrics-info').innerHTML = '<p>Failed to load metrics</p>';
            }
        }

        // Load data on page load
        loadData();

        // Auto-refresh every 30 seconds
        setInterval(loadData, 30000);
    </script>
</body>
</html>
EOF

    log SUCCESS "Monitoring dashboard created"
}

# Test monitoring setup
test_monitoring() {
    log INFO "Testing monitoring setup..."

    # Test health check script
    if $PROJECT_PATH/scripts/monitoring.sh health; then
        log SUCCESS "Health check script working"
    else
        log WARN "Health check script needs attention"
    fi

    # Test metrics generation
    if $PROJECT_PATH/scripts/monitoring.sh metrics >/dev/null; then
        log SUCCESS "Metrics generation working"
    else
        log WARN "Metrics generation needs attention"
    fi

    # Check if monitoring service can start
    if systemctl start ln-monitoring.service; then
        log SUCCESS "Monitoring service started successfully"
        systemctl status ln-monitoring.service --no-pager
    else
        log ERROR "Failed to start monitoring service"
    fi
}

# Main setup function
main() {
    log INFO "Starting LN Educacional monitoring setup..."

    check_root
    install_dependencies
    setup_logging
    setup_logrotate
    setup_backup_directories
    setup_monitoring_service
    setup_cron_jobs
    setup_fail2ban
    setup_monitoring_dashboard
    test_monitoring

    log SUCCESS "Monitoring setup completed!"

    echo ""
    echo "=== Setup Summary ==="
    echo "✓ Log rotation configured"
    echo "✓ Monitoring service created (ln-monitoring.service)"
    echo "✓ Cron jobs for maintenance tasks"
    echo "✓ Fail2ban security protection"
    echo "✓ Backup directories created"
    echo "✓ Monitoring dashboard available"
    echo ""
    echo "Next steps:"
    echo "1. Configure email alerts in monitoring.sh"
    echo "2. Set up SSL certificates"
    echo "3. Configure webhook notifications"
    echo "4. Review and customize thresholds in monitoring.sh"
    echo ""
    echo "Monitoring service status:"
    systemctl status ln-monitoring.service --no-pager
}

# Run main function
main "$@"