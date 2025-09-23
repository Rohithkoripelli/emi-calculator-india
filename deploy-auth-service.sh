#!/bin/bash

# Deploy Groww Authentication Service to Railway
# This script helps deploy only the Python service

echo "🚀 Deploying Groww Authentication Service..."

# Check if we're in the right directory
if [ ! -f "groww-auth-service/app.py" ]; then
    echo "❌ Please run this from the project root directory"
    echo "   Current directory should contain 'groww-auth-service' folder"
    exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check login status
echo "🔐 Checking Railway login..."
if ! railway whoami &> /dev/null; then
    echo "🔑 Please login to Railway:"
    railway login
    
    # Check again after login
    if ! railway whoami &> /dev/null; then
        echo "❌ Login failed. Please try again."
        exit 1
    fi
fi

echo "✅ Railway CLI ready"

# Navigate to service directory
cd groww-auth-service

echo "📁 Current directory: $(pwd)"
echo "📄 Files in directory:"
ls -la

# Create project
echo "🆕 Creating new Railway project..."
railway project create "groww-auth-service"

# Set environment variables
echo "⚙️  Setting environment variables..."
echo "Please enter your Groww API credentials:"

read -p "Enter GROWW_API_KEY: " api_key
read -p "Enter GROWW_API_SECRET: " api_secret

if [ -z "$api_key" ] || [ -z "$api_secret" ]; then
    echo "❌ API credentials are required"
    exit 1
fi

railway variable set GROWW_API_KEY="$api_key"
railway variable set GROWW_API_SECRET="$api_secret"
railway variable set FLASK_ENV=production

echo "✅ Environment variables set"

# Deploy
echo "🚀 Deploying service..."
railway up

echo ""
echo "✅ Deployment complete!"
echo "🌐 Check your Railway dashboard for the service URL"
echo "🧪 Test with: curl https://your-service-url.railway.app/"