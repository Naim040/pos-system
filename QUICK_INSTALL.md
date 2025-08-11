# Quick Installation Guide

This guide provides step-by-step instructions for quickly installing the POS system on a local PC or custom domain.

## Option 1: Local PC Installation (Windows)

### Prerequisites
- Windows 10/11
- Administrative privileges

### Step 1: Install Node.js
1. Download Node.js from [https://nodejs.org](https://nodejs.org)
2. Run the installer with default settings
3. Open Command Prompt and verify:
   ```cmd
   node --version
   npm --version
   ```

### Step 2: Download POS System
1. Download the POS system ZIP file
2. Extract to `C:\pos-system`
3. Open Command Prompt as Administrator:
   ```cmd
   cd C:\pos-system
   ```

### Step 3: Install Dependencies
```cmd
npm install
```

### Step 4: Setup Database
```cmd
npm run db:generate
npm run db:push
npx tsx prisma/seed.ts
```

### Step 5: Build and Start
```cmd
npm run build
npm start
```

### Step 6: Access POS System
- Open browser and go to `http://localhost:3000`
- Login with:
  - Email: `admin@pos.com`
  - Password: `password`

## Option 2: Local PC Installation (Linux/macOS)

### Prerequisites
- Terminal access
- Internet connection

### Step 1: Install Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node
```

### Step 2: Download POS System
```bash
git clone <repository-url> pos-system
cd pos-system
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Setup Database
```bash
npm run db:generate
npm run db:push
npx tsx prisma/seed.ts
```

### Step 5: Build and Start
```bash
npm run build
npm start
```

### Step 6: Access POS System
- Open browser and go to `http://localhost:3000`
- Login with:
  - Email: `admin@pos.com`
  - Password: `password`

## Option 3: Custom Domain Deployment

### Prerequisites
- Domain name
- Server/VPS with Ubuntu 20.04+
- SSH access to server

### Step 1: Server Setup
```bash
# Connect to server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: Deploy POS System
```bash
# Create application directory
sudo mkdir -p /opt/pos-system
sudo chown $USER:$USER /opt/pos-system
cd /opt/pos-system

# Clone repository
git clone <repository-url> .

# Install dependencies
npm install

# Setup database
npm run db:generate
npm run db:push
npx tsx prisma/seed.ts

# Build application
npm run build
```

### Step 3: Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/pos-system
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
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
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: Setup SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Step 5: Create System Service
```bash
sudo nano /etc/systemd/system/pos-system.service
```

Paste this configuration:
```ini
[Unit]
Description=POS System Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/pos-system
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable pos-system
sudo systemctl start pos-system
```

### Step 6: Access POS System
- Open browser and go to `https://your-domain.com`
- Login with:
  - Email: `admin@pos.com`
  - Password: `password`

## Option 4: Docker Deployment

### Prerequisites
- Docker installed
- Docker Compose installed

### Step 1: Create Docker Files
Create `docker-compose.yml`:
```yaml
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

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - pos-system
    restart: unless-stopped
```

### Step 2: Start Services
```bash
docker-compose up -d
```

### Step 3: Access POS System
- Open browser and go to `http://your-server-ip`
- Login with:
  - Email: `admin@pos.com`
  - Password: `password`

## Post-Installation Verification

### Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Basic Functionality Test
1. [ ] Login page loads
2. [ ] Default credentials work
3. [ ] Product catalog displays
4. [ ] Add items to cart
5. [ ] Checkout process works
6. [ ] Receipt generation works

## Troubleshooting

### Port Already in Use
```bash
# Linux/macOS
sudo lsof -i :3000
sudo kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Issues
```bash
# Reset database
rm -f data/custom.db
npm run db:push
npx tsx prisma/seed.ts
```

### Service Won't Start
```bash
# Check logs
sudo journalctl -u pos-system -f

# Restart service
sudo systemctl restart pos-system
```

## Support

For additional help:
- Check the full installation guide: `INSTALLATION_GUIDE.md`
- Review system requirements
- Contact support team

---

This quick guide should get you up and running quickly. For detailed configuration and advanced setup, please refer to the comprehensive installation guide.