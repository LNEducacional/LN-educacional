#!/bin/bash

# LN Educacional - Monitoring Script
# System monitoring, health checks, and alerting

set -e

# Configuration
PROJECT_NAME="ln-educacional"
HEALTH_CHECK_URL="http://localhost:3333/health"
CLIENT_URL="http://localhost:3000"
DATABASE_URL=${DATABASE_URL:-"postgresql://lnuser:c01a29b03f35a043b9246845@localhost:5432/lneducacional"}
REDIS_URL=${REDIS_URL:-"redis://:6d96bde2553250929372d4af@localhost:6379"}
LOG_FILE="/var/log/monitoring-ln-educacional.log"
ALERT_EMAIL="admin@lneducacional.com"
METRICS_FILE="/tmp/ln-metrics.json"

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=85
RESPONSE_TIME_THRESHOLD=2000  # ms
ERROR_RATE_THRESHOLD=5        # %

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

# Check if service is running
check_service_status() {
    local service_name=$1

    if pm2 list | grep -q "$service_name.*online"; then
        return 0
    else
        return 1
    fi
}

# Check HTTP endpoint
check_http_endpoint() {
    local url=$1
    local timeout=${2:-5}
    local expected_status=${3:-200}

    local response_time
    local http_status

    # Measure response time and get HTTP status
    response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time "$timeout" "$url" 2>/dev/null || echo "timeout")
    http_status=$(curl -o /dev/null -s -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo "000")

    if [ "$response_time" = "timeout" ] || [ "$http_status" != "$expected_status" ]; then
        return 1
    fi

    # Convert to milliseconds
    response_time_ms=$(echo "$response_time * 1000" | bc)

    # Store response time for metrics
    echo "$response_time_ms" > /tmp/last_response_time

    return 0
}

# Check database connectivity
check_database() {
    log INFO "Checking database connectivity..."

    # Extract connection details from DATABASE_URL
    local db_host=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    local db_port=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

    if timeout 5 bash -c "</dev/tcp/$db_host/$db_port" 2>/dev/null; then
        log SUCCESS "Database is accessible"
        return 0
    else
        log ERROR "Database is not accessible"
        return 1
    fi
}

# Check Redis connectivity
check_redis() {
    log INFO "Checking Redis connectivity..."

    # Extract connection details from REDIS_URL
    local redis_host=$(echo "$REDIS_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    local redis_port=$(echo "$REDIS_URL" | sed -n 's/.*:\([0-9]*\).*/\1/p')

    if [ -z "$redis_host" ]; then
        redis_host="localhost"
    fi

    if [ -z "$redis_port" ]; then
        redis_port="6379"
    fi

    if timeout 5 bash -c "</dev/tcp/$redis_host/$redis_port" 2>/dev/null; then
        log SUCCESS "Redis is accessible"
        return 0
    else
        log ERROR "Redis is not accessible"
        return 1
    fi
}

# Get system metrics
get_system_metrics() {
    local cpu_usage
    local memory_usage
    local disk_usage
    local load_average

    # CPU usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')

    # Memory usage
    memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')

    # Disk usage
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

    # Load average
    load_average=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')

    echo "cpu:$cpu_usage,memory:$memory_usage,disk:$disk_usage,load:$load_average"
}

# Get application metrics
get_app_metrics() {
    local server_status="down"
    local client_status="down"
    local response_time="0"
    local error_count="0"

    # Check server status
    if check_service_status "ln-educacional-server"; then
        server_status="up"
    fi

    # Check client status
    if check_service_status "ln-educacional-client"; then
        client_status="up"
    fi

    # Get response time if available
    if [ -f /tmp/last_response_time ]; then
        response_time=$(cat /tmp/last_response_time)
    fi

    # Get error count from logs (last hour)
    error_count=$(grep -c "ERROR" "$LOG_FILE" 2>/dev/null || echo "0")

    echo "server:$server_status,client:$client_status,response_time:$response_time,errors:$error_count"
}

# Check PM2 processes
check_pm2_processes() {
    log INFO "Checking PM2 processes..."

    local processes=("ln-educacional-server" "ln-educacional-client")
    local failed_processes=()

    for process in "${processes[@]}"; do
        if ! check_service_status "$process"; then
            failed_processes+=("$process")
            log ERROR "Process $process is not running"
        else
            log SUCCESS "Process $process is running"
        fi
    done

    if [ ${#failed_processes[@]} -gt 0 ]; then
        log ERROR "Failed processes: ${failed_processes[*]}"
        return 1
    fi

    return 0
}

# Health check
health_check() {
    log INFO "Performing comprehensive health check..."

    local health_status="healthy"
    local issues=()

    # Check PM2 processes
    if ! check_pm2_processes; then
        health_status="unhealthy"
        issues+=("PM2 processes")
    fi

    # Check server endpoint
    if ! check_http_endpoint "$HEALTH_CHECK_URL"; then
        health_status="unhealthy"
        issues+=("Server endpoint")
        log ERROR "Server health check failed"
    else
        log SUCCESS "Server health check passed"
    fi

    # Check client endpoint
    if ! check_http_endpoint "$CLIENT_URL"; then
        health_status="degraded"
        issues+=("Client endpoint")
        log WARN "Client health check failed"
    else
        log SUCCESS "Client health check passed"
    fi

    # Check database
    if ! check_database; then
        health_status="unhealthy"
        issues+=("Database")
    fi

    # Check Redis
    if ! check_redis; then
        health_status="degraded"
        issues+=("Redis")
    fi

    # Check system resources
    local sys_metrics=$(get_system_metrics)
    local cpu=$(echo "$sys_metrics" | tr ',' '\n' | grep "cpu:" | cut -d':' -f2)
    local memory=$(echo "$sys_metrics" | tr ',' '\n' | grep "memory:" | cut -d':' -f2)
    local disk=$(echo "$sys_metrics" | tr ',' '\n' | grep "disk:" | cut -d':' -f2)

    if (( $(echo "$cpu > $CPU_THRESHOLD" | bc -l) )); then
        health_status="degraded"
        issues+=("High CPU usage: ${cpu}%")
        log WARN "High CPU usage: ${cpu}%"
    fi

    if (( $(echo "$memory > $MEMORY_THRESHOLD" | bc -l) )); then
        health_status="degraded"
        issues+=("High memory usage: ${memory}%")
        log WARN "High memory usage: ${memory}%"
    fi

    if [ "$disk" -gt "$DISK_THRESHOLD" ]; then
        health_status="degraded"
        issues+=("High disk usage: ${disk}%")
        log WARN "High disk usage: ${disk}%"
    fi

    # Output health status
    case $health_status in
        healthy)
            log SUCCESS "System is healthy"
            ;;
        degraded)
            log WARN "System is degraded: ${issues[*]}"
            ;;
        unhealthy)
            log ERROR "System is unhealthy: ${issues[*]}"
            ;;
    esac

    return $([ "$health_status" = "unhealthy" ] && echo 1 || echo 0)
}

# Generate metrics report
generate_metrics() {
    log INFO "Generating metrics report..."

    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local sys_metrics=$(get_system_metrics)
    local app_metrics=$(get_app_metrics)

    # Create JSON metrics
    cat > "$METRICS_FILE" << EOF
{
  "timestamp": "$timestamp",
  "system": {
    "cpu_usage": $(echo "$sys_metrics" | tr ',' '\n' | grep "cpu:" | cut -d':' -f2),
    "memory_usage": $(echo "$sys_metrics" | tr ',' '\n' | grep "memory:" | cut -d':' -f2),
    "disk_usage": $(echo "$sys_metrics" | tr ',' '\n' | grep "disk:" | cut -d':' -f2),
    "load_average": $(echo "$sys_metrics" | tr ',' '\n' | grep "load:" | cut -d':' -f2)
  },
  "application": {
    "server_status": "$(echo "$app_metrics" | tr ',' '\n' | grep "server:" | cut -d':' -f2)",
    "client_status": "$(echo "$app_metrics" | tr ',' '\n' | grep "client:" | cut -d':' -f2)",
    "response_time_ms": $(echo "$app_metrics" | tr ',' '\n' | grep "response_time:" | cut -d':' -f2),
    "error_count": $(echo "$app_metrics" | tr ',' '\n' | grep "errors:" | cut -d':' -f2)
  }
}
EOF

    log SUCCESS "Metrics saved to $METRICS_FILE"
}

# Send alert
send_alert() {
    local severity=$1
    local message=$2

    # Log the alert
    log ERROR "ALERT [$severity]: $message"

    # Send email alert (requires mailutils)
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "[$PROJECT_NAME] Alert: $severity" "$ALERT_EMAIL"
    fi

    # Send webhook notification (placeholder)
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"[$PROJECT_NAME] Alert [$severity]: $message\"}" \
    #     YOUR_WEBHOOK_URL
}

# Restart failed services
restart_services() {
    log INFO "Attempting to restart failed services..."

    local processes=("ln-educacional-server" "ln-educacional-client")

    for process in "${processes[@]}"; do
        if ! check_service_status "$process"; then
            log INFO "Restarting $process..."
            pm2 restart "$process"
            sleep 5

            if check_service_status "$process"; then
                log SUCCESS "$process restarted successfully"
            else
                log ERROR "Failed to restart $process"
                send_alert "CRITICAL" "Failed to restart $process"
            fi
        fi
    done
}

# Main monitoring loop
monitor() {
    local interval=${1:-60}  # Default 60 seconds

    log INFO "Starting monitoring with ${interval}s interval..."

    while true; do
        # Generate metrics
        generate_metrics

        # Perform health check
        if ! health_check; then
            send_alert "WARNING" "Health check failed"

            # Attempt automatic recovery
            restart_services

            # Wait and recheck
            sleep 30
            if ! health_check; then
                send_alert "CRITICAL" "System remains unhealthy after restart attempt"
            fi
        fi

        sleep "$interval"
    done
}

# Cleanup old logs
cleanup_logs() {
    log INFO "Cleaning up old logs..."

    # Keep last 7 days of logs
    find /var/log -name "*ln-educacional*" -type f -mtime +7 -delete 2>/dev/null || true

    # Rotate current log if it's too large (>100MB)
    if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -gt 104857600 ]; then
        mv "$LOG_FILE" "${LOG_FILE}.$(date +%Y%m%d_%H%M%S)"
        touch "$LOG_FILE"
    fi

    log SUCCESS "Log cleanup completed"
}

# Script options
case "${1:-health}" in
    health)
        health_check
        ;;
    metrics)
        generate_metrics
        cat "$METRICS_FILE"
        ;;
    monitor)
        monitor "${2:-60}"
        ;;
    restart)
        restart_services
        ;;
    cleanup)
        cleanup_logs
        ;;
    *)
        echo "Usage: $0 {health|metrics|monitor [interval]|restart|cleanup}"
        exit 1
        ;;
esac