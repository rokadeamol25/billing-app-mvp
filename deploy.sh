#!/bin/bash

# Exit on error
set -e

# Update system and install dependencies
sudo apt update
sudo apt install -y curl git

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2

# Create app directory
sudo mkdir -p /var/www/app
sudo chown -R $USER:$USER /var/www/app
cd /var/www/app

# Clone repository (replace with your actual repository URL)
git clone https://github.com/rokadeamol25/billing-app-mvp.git .

# Setup database
sudo -u postgres psql << EOF
CREATE DATABASE billing_software;
CREATE USER billing_user WITH PASSWORD 'Billing@123';
GRANT ALL PRIVILEGES ON DATABASE billing_software TO billing_user;
\c billing_software;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
EOF

# Import schema
sudo -u postgres psql -d billing_software -f database/schema.sql

# Setup backend
cd server
cp .env.example .env

# Update environment variables
sed -i 's/DB_HOST=localhost/DB_HOST=localhost/' .env
sed -i 's/DB_PORT=5432/DB_PORT=5432/' .env
sed -i 's/DB_NAME=billing_software/DB_NAME=billing_software/' .env
sed -i 's/DB_USER=postgres/DB_USER=billing_user/' .env
sed -i 's/DB_PASSWORD=1234/DB_PASSWORD=Billing@123/' .env

# Install dependencies and start server
npm install
pm2 start src/index.js --name "billing-backend"

# Setup frontend
cd ../client
npm install
npm run build

# Install and configure nginx
sudo apt install -y nginx

# Create nginx configuration
sudo tee /etc/nginx/sites-available/billing-app << EOF
server {
    listen 80;
    server_name omsaiclinic.online;

    location / {
        root /var/www/app/client/build;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/billing-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "Deployment completed! Access your application at http://omsaiclinic.online"