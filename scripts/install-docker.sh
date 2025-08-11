#!/bin/bash
# POS System Docker Installation Script
# Run this script to install POS System using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}POS System Docker Installation${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed${NC}"
    echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if running as root for Docker socket access
if [[ $EUID -ne 0 ]]; then
    echo -e "${YELLOW}Checking Docker permissions...${NC}"
    if ! docker ps &> /dev/null; then
        echo -e "${RED}Cannot access Docker daemon. Please run this script with sudo or add your user to the docker group.${NC}"
        echo "To add user to docker group: sudo usermod -aG docker \$USER"
        echo "Then log out and log back in."
        exit 1
    fi
fi

# Get current user
CURRENT_USER=${SUDO_USER:-$(whoami)}
echo "Current user: $CURRENT_USER"

# Set installation directory
INSTALL_DIR="$(pwd)"
echo "Installation directory: $INSTALL_DIR"

# Create Dockerfile if it doesn't exist
if [[ ! -f "Dockerfile" ]]; then
    echo -e "${YELLOW}Creating Dockerfile...${NC}"
    cat > Dockerfile << 'EOF'
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
USER nextjs

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
EOF
fi

# Create docker-compose.yml if it doesn't exist
if [[ ! -f "docker-compose.yml" ]]; then
    echo -e "${YELLOW}Creating docker-compose.yml...${NC}"
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  pos-system:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/custom.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - pos-system
    restart: unless-stopped
    profiles:
      - nginx
EOF
fi

# Create data directory
mkdir -p data
chmod 755 data

# Create basic nginx configuration
if [[ ! -f "nginx.conf" ]]; then
    echo -e "${YELLOW}Creating nginx.conf...${NC}"
    cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream pos_backend {
        server pos-system:3000;
    }

    server {
        listen 80;
        server_name _;

        client_max_body_size 10M;

        location / {
            proxy_pass http://pos_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/socketio {
            proxy_pass http://pos_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF
fi

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker-compose build

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

# Wait for service to be healthy
echo -e "${YELLOW}Waiting for POS System to be ready...${NC}"
for i in {1..30}; do
    if docker-compose ps | grep -q "pos-system.*healthy"; then
        echo -e "${GREEN}POS System is healthy!${NC}"
        break
    fi
    if [[ $i -eq 30 ]]; then
        echo -e "${RED}POS System failed to start within expected time${NC}"
        echo "Check logs: docker-compose logs pos-system"
        exit 1
    fi
    sleep 2
    echo -n "."
done
echo

# Initialize database
echo -e "${YELLOW}Initializing database...${NC}"
docker-compose exec pos-system npm run db:push
docker-compose exec pos-system npx tsx prisma/seed.ts

# Ask if user wants to configure custom domain
read -p "Do you want to configure a custom domain? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your domain name (e.g., pos.example.com): " DOMAIN_NAME
    
    if [[ -n "$DOMAIN_NAME" ]]; then
        # Update nginx configuration
        sed -i "s/server_name _;/server_name $DOMAIN_NAME www.$DOMAIN_NAME;/" nginx.conf
        
        # Ask about SSL
        read -p "Do you want to configure SSL with Let's Encrypt? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}SSL configuration requires manual setup after installation.${NC}"
            echo "Please follow these steps after installation:"
            echo "1. Ensure your domain points to this server"
            echo "2. Run: docker-compose down"
            echo "3. Get SSL certificates using certbot"
            echo "4. Place certificates in ./ssl/ directory"
            echo "5. Update nginx.conf for SSL configuration"
            echo "6. Run: docker-compose up -d --profile nginx"
        fi
        
        # Restart with nginx
        docker-compose down
        docker-compose up -d --profile nginx
    fi
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Docker Installation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${GREEN}POS System is now running in Docker containers.${NC}"
echo
echo -e "${YELLOW}Access the POS System at:${NC}"
echo "  Local: http://localhost:3000"
echo "  Network: http://$SERVER_IP:3000"
if [[ -n "$DOMAIN_NAME" ]]; then
    echo "  Domain: http://$DOMAIN_NAME"
fi
echo
echo -e "${YELLOW}Default login credentials:${NC}"
echo "  Email: admin@pos.com"
echo "  Password: password"
echo
echo -e "${YELLOW}Docker Commands:${NC}"
echo "  View logs:        docker-compose logs -f"
echo "  Stop services:    docker-compose down"
echo "  Start services:   docker-compose up -d"
echo "  Restart services: docker-compose restart"
echo "  View status:      docker-compose ps"
echo
echo -e "${YELLOW}Data Directory:${NC} $INSTALL_DIR/data"
echo -e "${YELLOW}Database Location:${NC} $INSTALL_DIR/data/custom.db"
echo
echo -e "${GREEN}Docker installation completed successfully!${NC}"