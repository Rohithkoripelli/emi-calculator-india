# Stock Scheduler Service

This service runs daily at 2 AM IST to fetch real stock data for 2600+ stocks.

## Railway Deployment

### Option 1: Add as New Service to Existing Project

```bash
# From Railway dashboard:
# 1. Go to your existing project
# 2. Click "New Service"
# 3. Select "Deploy from GitHub repo" 
# 4. Choose this repo
# 5. Set root directory: stock-scheduler-service
# 6. Set environment variables:
#    - NODE_ENV=production
#    - TZ=Asia/Kolkata
```

### Option 2: Railway CLI

```bash
railway login
railway link [your-existing-project-id]
railway service create --name stock-scheduler
railway service connect --repo Rohithkoripelli/emi-calculator-india --root stock-scheduler-service
railway env set NODE_ENV=production
railway env set TZ=Asia/Kolkata
```

## What it does

- Runs `daily-scheduler-2am.js` 24/7
- Triggers real data fetch every day at 2:00 AM IST
- Updates MongoDB with fresh stock data for 2600+ stocks
- Logs all operations to `update_logs` collection

## Files included

- `daily-scheduler-2am.js` - Main cron scheduler
- `real-data-fetcher-2600.js` - Real data extraction from Screener.in
- `complete-stock-universe.js` - 1859 stock symbols
- `package.json` - Node.js dependencies
- `Dockerfile` - Container configuration
- `railway.toml` - Railway deployment settings