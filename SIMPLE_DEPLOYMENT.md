# Simple Deployment Guide for Billing Software

## 1. Basic Server Setup
```bash
# Update system and install Node.js
sudo apt update
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql

# Install PM2 for process management
sudo npm install -g pm2
```

## 2. Quick Database Setup
```bash
sudo -u postgres psql
CREATE DATABASE billing_software;
CREATE USER billing_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE billing_software TO billing_user;
\q
```

## 3. Deploy Application
```bash
# Create app directory
mkdir -p /var/www/app
cd /var/www/app

# Clone repository
git clone <your-repository-url> .

# Setup environment variables
cd server
cp .env.example .env
# Edit .env with your database credentials

# Install dependencies and start server
npm install
pm2 start src/index.js --name "billing-app"

# Build and serve frontend
cd ../client
npm install
npm run build

# Install and setup nginx
sudo apt install -y nginx

# Create nginx config
sudo tee /etc/nginx/sites-available/billing-app << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/app/client/build;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
}
EOF

# Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/billing-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

That's it! Your application should now be accessible through your domain or server IP address.