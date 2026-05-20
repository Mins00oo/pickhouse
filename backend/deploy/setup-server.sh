#!/usr/bin/env bash
set -euo pipefail

: "${DOMAIN:?DOMAIN env var required, e.g. api.pickhouse.app}"
: "${EMAIL:?EMAIL env var required for Let's Encrypt}"

sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release nginx certbot python3-certbot-nginx iptables-persistent

# Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"

# Firewall - UFW + Oracle iptables
sudo apt-get install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

sudo iptables -I INPUT 6 -p tcp -m state --state NEW -m tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp -m state --state NEW -m tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save || true

# Initial HTTP-only nginx so certbot can solve ACME challenge
sudo tee /etc/nginx/sites-available/pickhouse > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 "ok"; }
}
EOF
sudo mkdir -p /var/www/certbot
sudo ln -sf /etc/nginx/sites-available/pickhouse /etc/nginx/sites-enabled/pickhouse
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Issue cert
sudo certbot --nginx --non-interactive --agree-tos -m "$EMAIL" -d "$DOMAIN"

# Install full reverse-proxy config
sudo cp "$(dirname "$0")/nginx.conf" /etc/nginx/sites-available/pickhouse
sudo nginx -t && sudo systemctl reload nginx

# Cert auto-renew (systemd timer installed by certbot)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo "Server setup complete. Log out and back in for docker group membership to take effect."
