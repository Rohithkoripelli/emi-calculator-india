# Railway CLI Deployment Guide

If the Railway dashboard root directory setting isn't working, use the CLI method:

## 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

## 2. Login to Railway

```bash
railway login
```

## 3. Deploy from Service Directory

```bash
# Navigate to the service directory
cd groww-auth-service

# Create a new Railway project from this directory
railway project create

# Set environment variables
railway variable set GROWW_API_KEY=your_api_key_here
railway variable set GROWW_API_SECRET=your_totp_secret_here
railway variable set FLASK_ENV=production

# Deploy
railway up
```

## 4. Alternative: Link to Existing Project

If you want to keep your existing Railway project:

```bash
cd groww-auth-service
railway link [your-project-id]
railway up
```

This ensures Railway builds from the correct directory and recognizes it as a Python project.