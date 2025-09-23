# Railway Deployment Guide for Stock Data Scheduler

## Overview
This guide shows how to deploy the 2 AM stock data scheduler to Railway for automatic daily updates.

## Quick Deployment Steps

### 1. Create Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway project create stock-scheduler
```

### 2. Deploy Scheduler Service
```bash
# Link to your GitHub repo
railway service create --name scheduler

# Set environment variables
railway env set NODE_ENV=production
railway env set TZ=Asia/Kolkata

# Deploy from GitHub
railway service connect --repo Rohithkoripelli/emi-calculator-india
```

### 3. Configure Service
- Set start command: `node daily-scheduler-2am.js`
- Enable auto-deploy from main branch
- Set restart policy to "always"

## What Happens After Deployment

✅ **Automatic 2 AM Daily Updates**
- Railway will run the scheduler 24/7
- Every day at 2:00 AM IST, it will:
  1. Fetch real data for 2600+ stocks
  2. Update MongoDB with fresh market data
  3. Log success/failure to update_logs collection

✅ **Production Features**
- Auto-restart on crashes
- IST timezone configuration
- Rate limiting (1 stock per 5 seconds)
- Error logging and monitoring

## Manual Commands

Test immediate update:
```bash
railway shell
node daily-scheduler-2am.js --immediate
```

Check logs:
```bash
railway logs --follow
```

## Environment Variables Required
- `NODE_ENV=production`
- `TZ=Asia/Kolkata`
- MongoDB connection string is hardcoded in daily-scheduler-2am.js

## Files Deployed
- `daily-scheduler-2am.js` - Main scheduler
- `real-data-fetcher-2600.js` - Real data extraction
- `complete-stock-universe.js` - 1859 stock symbols
- `package.json` - Dependencies including node-cron
- `Dockerfile` - Container configuration
- `railway.toml` - Railway deployment settings