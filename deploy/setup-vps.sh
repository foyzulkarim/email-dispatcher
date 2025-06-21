#!/bin/bash

# Email Dispatcher VPS Setup Script
# This script sets up a VPS for deploying the email dispatcher application

set -e

# Configuration
APP_DIR="/opt/email-dispatcher"
USER="emaildispatcher"
NGINX_CONF_DIR="/etc/nginx/sites-available"
DOMAIN="${DOMAIN:-localhost}"

echo "🚀 Starting VPS setup for Email Dispatcher..."

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt-get install -y \
    docker.io \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    htop \
    curl \
    git \
    unzip

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Create application user
echo "👤 Creating application user..."
if ! id "$USER" &>/dev/null; then
    useradd -m -s /bin/bash "$USER"
    usermod -aG docker "$USER"
fi

# Create application directory
echo "📁 Setting up application directory..."
mkdir -p "$APP_DIR"
chown "$USER:$USER" "$APP_DIR"

# Setup firewall
echo "🔒 Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# Configure fail2ban
echo "🛡️ Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# Setup Docker logging
echo "📝 Configuring Docker logging..."
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker

# Clone repository
echo "📥 Cloning repository..."
cd "$APP_DIR"
if [ ! -d ".git" ]; then
    git clone https://github.com/YOUR_USERNAME/email-dispatcher.git .
    chown -R "$USER:$USER" "$APP_DIR"
fi

# Setup environment file
echo "⚙️ Setting up environment configuration..."
if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    echo "📝 Please edit $APP_DIR/.env with your actual configuration"
fi

# Setup SSL certificates (if domain is provided and not localhost)
if [ "$DOMAIN" != "localhost" ]; then
    echo "🔐 Setting up SSL certificates..."
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
fi

# Setup log rotation
echo "📋 Setting up log rotation..."
cat > /etc/logrotate.d/email-dispatcher << EOF
/opt/email-dispatcher/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

# Create systemd service for automatic startup
echo "🔄 Creating systemd service..."
cat > /etc/systemd/system/email-dispatcher.service << EOF
[Unit]
Description=Email Dispatcher Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
User=$USER

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable email-dispatcher

# Setup monitoring script
echo "📊 Setting up monitoring..."
mkdir -p "$APP_DIR/scripts"
cat > "$APP_DIR/scripts/health-check.sh" << 'EOF'
#!/bin/bash

# Health check script for email dispatcher
LOG_FILE="/opt/email-dispatcher/logs/health-check.log"
mkdir -p "$(dirname "$LOG_FILE")"

check_service() {
    local service_name="$1"
    local service_url="$2"
    
    if curl -f -s "$service_url" > /dev/null 2>&1; then
        echo "$(date): $service_name - OK" >> "$LOG_FILE"
        return 0
    else
        echo "$(date): $service_name - FAILED" >> "$LOG_FILE"
        return 1
    fi
}

# Check application health
if ! check_service "Email Dispatcher API" "http://localhost:3001/health"; then
    echo "$(date): Restarting email dispatcher..." >> "$LOG_FILE"
    cd /opt/email-dispatcher
    docker-compose -f docker-compose.prod.yml restart server
fi

# Check frontend
check_service "Email Dispatcher Frontend" "http://localhost/"

# Clean old logs (keep last 100 lines)
tail -n 100 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
EOF

chmod +x "$APP_DIR/scripts/health-check.sh"
chown "$USER:$USER" "$APP_DIR/scripts/health-check.sh"

# Setup cron job for health checks
echo "⏰ Setting up health check cron job..."
(crontab -u "$USER" -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/scripts/health-check.sh") | crontab -u "$USER" -

# Create deployment script
cat > "$APP_DIR/deploy.sh" << 'EOF'
#!/bin/bash

# Deployment script for email dispatcher
set -e

echo "🚀 Starting deployment..."

# Pull latest changes
git pull origin main

# Pull latest Docker images
docker-compose -f docker-compose.prod.yml pull

# Deploy with zero downtime
docker-compose -f docker-compose.prod.yml up -d --remove-orphans

# Clean up old images
docker image prune -f

# Health check
sleep 30
if curl -f http://localhost/health; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed - health check failed"
    exit 1
fi
EOF

chmod +x "$APP_DIR/deploy.sh"
chown "$USER:$USER" "$APP_DIR/deploy.sh"

echo "✅ VPS setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit $APP_DIR/.env with your actual configuration"
echo "2. Run: sudo -u $USER $APP_DIR/deploy.sh"
echo "3. Access your application at: http://$DOMAIN"
echo ""
echo "Useful commands:"
echo "- View logs: docker-compose -f $APP_DIR/docker-compose.prod.yml logs -f"
echo "- Restart services: docker-compose -f $APP_DIR/docker-compose.prod.yml restart"
echo "- Update application: sudo -u $USER $APP_DIR/deploy.sh" 
