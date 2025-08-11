#!/bin/bash
# POS System Linux Installation Script
# Run this script with sudo privileges

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}POS System Linux Installation${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   echo "Please run: sudo $0"
   exit 1
fi

# Get current user
CURRENT_USER=${SUDO_USER:-$(whoami)}
echo "Current user: $CURRENT_USER"

# Set installation directory
INSTALL_DIR="/opt/pos-system"
echo "Installation directory: $INSTALL_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed. Installing Node.js...${NC}"
    
    # Detect OS
    if [[ -f /etc/debian_version ]]; then
        # Debian/Ubuntu
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        apt-get install -y nodejs
    elif [[ -f /etc/redhat-release ]]; then
        # RHEL/CentOS
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        yum install -y nodejs
    else
        echo -e "${RED}Unsupported OS. Please install Node.js manually.${NC}"
        exit 1
    fi
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
if [[ $NODE_VERSION -lt 18 ]]; then
    echo -e "${RED}Node.js version 18 or higher is required${NC}"
    exit 1
fi

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}Git is not installed. Installing Git...${NC}"
    
    if [[ -f /etc/debian_version ]]; then
        apt-get install -y git
    elif [[ -f /etc/redhat-release ]]; then
        yum install -y git
    fi
fi

echo -e "${GREEN}Node.js and Git are installed${NC}"
echo

# Create installation directory
mkdir -p "$INSTALL_DIR"
chown "$CURRENT_USER:$CURRENT_USER" "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Check if already installed
if [[ -f "package.json" ]]; then
    echo -e "${YELLOW}POS System is already installed in this directory${NC}"
    read -p "Do you want to reinstall? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
    
    echo "Cleaning up previous installation..."
    sudo -u "$CURRENT_USER" rm -rf node_modules
    sudo -u "$CURRENT_USER" rm -f package-lock.json
fi

# Download POS System
echo -e "${YELLOW}Downloading POS System...${NC}"
read -p "Enter repository URL (or press Enter for manual installation): " REPO_URL

if [[ -n "$REPO_URL" ]]; then
    sudo -u "$CURRENT_USER" git clone "$REPO_URL" .
else
    echo "Please extract the POS System files to $INSTALL_DIR manually."
    echo "Then run this script again."
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
sudo -u "$CURRENT_USER" npm install

# Setup database
echo -e "${YELLOW}Setting up database...${NC}"
sudo -u "$CURRENT_USER" npm run db:generate
sudo -u "$CURRENT_USER" npm run db:push
sudo -u "$CURRENT_USER" npx tsx prisma/seed.ts

# Build application
echo -e "${YELLOW}Building application...${NC}"
sudo -u "$CURRENT_USER" npm run build

# Create systemd service
echo -e "${YELLOW}Creating systemd service...${NC}"
cat > /etc/systemd/system/pos-system.service << EOF
[Unit]
Description=POS System Server
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable and start service
echo -e "${YELLOW}Starting POS System service...${NC}"
systemctl enable pos-system
systemctl start pos-system

# Check service status
if systemctl is-active --quiet pos-system; then
    echo -e "${GREEN}POS System service started successfully${NC}"
else
    echo -e "${RED}Failed to start POS System service${NC}"
    echo "Checking service logs:"
    journalctl -u pos-system -n 20 --no-pager
    exit 1
fi

# Install Nginx (optional)
read -p "Do you want to install Nginx for reverse proxy? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Installing Nginx...${NC}"
    
    if [[ -f /etc/debian_version ]]; then
        apt-get install -y nginx
    elif [[ -f /etc/redhat-release ]]; then
        yum install -y nginx
    fi
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/pos-system << EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api/socketio {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Enable site
    ln -sf /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and restart Nginx
    nginx -t
    systemctl restart nginx
    
    echo -e "${GREEN}Nginx configured successfully${NC}"
fi

# Configure firewall (if active)
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        echo -e "${YELLOW}Configuring firewall...${NC}"
        ufw allow 3000/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
    fi
fi

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${GREEN}POS System is now running as a systemd service.${NC}"
echo
echo -e "${YELLOW}Access the POS System at:${NC}"
echo "  Local: http://localhost:3000"
if command -v ip &> /dev/null; then
    SERVER_IP=$(ip route get 1.1.1.1 | awk '{print $7; exit}')
    echo "  Network: http://$SERVER_IP:3000"
fi
echo
echo -e "${YELLOW}Default login credentials:${NC}"
echo "  Email: admin@pos.com"
echo "  Password: password"
echo
echo -e "${YELLOW}Service Management:${NC}"
echo "  Start:   sudo systemctl start pos-system"
echo "  Stop:    sudo systemctl stop pos-system"
echo "  Restart: sudo systemctl restart pos-system"
echo "  Status:  sudo systemctl status pos-system"
echo "  Logs:    sudo journalctl -u pos-system -f"
echo
echo -e "${YELLOW}Installation directory:${NC} $INSTALL_DIR"
echo -e "${YELLOW}Database location:${NC} $INSTALL_DIR/db/custom.db"
echo
echo -e "${GREEN}Installation completed successfully!${NC}"