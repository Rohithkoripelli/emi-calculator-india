#!/bin/bash

# Deploy script for Railway CLI
echo "🚀 Deploying Groww Authentication Service to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if logged in
echo "🔐 Checking Railway login status..."
if ! railway whoami &> /dev/null; then
    echo "🔑 Please login to Railway:"
    railway login
fi

# Deploy from this directory
echo "📦 Deploying from current directory (groww-auth-service)..."
railway deploy

echo "✅ Deployment initiated! Check Railway dashboard for progress."