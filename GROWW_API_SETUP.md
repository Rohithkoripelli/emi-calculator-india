# 🚀 Groww API Setup Guide

## What You Need

Your Groww API credentials:
- **API Key** 
- **API Secret** 

## Step 1: Local Environment Setup

1. **Add your credentials to the `.env` file** (already created for you):

```bash
# Open .env file in your project root
REACT_APP_GROWW_API_KEY=your_actual_api_key_here
REACT_APP_GROWW_API_SECRET=your_actual_api_secret_here
```

2. **Replace the placeholder values** with your actual Groww API credentials.

## Step 2: Vercel Environment Variables Setup

1. **Go to your Vercel dashboard** → Select your project → Settings → Environment Variables

2. **Add these two variables:**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `REACT_APP_GROWW_API_KEY` | Your actual API key | Production, Preview, Development |
| `REACT_APP_GROWW_API_SECRET` | Your actual API secret | Production, Preview, Development |

3. **Make sure to set them for all environments** (Production, Preview, Development)

## Step 3: Deploy

Once environment variables are set in Vercel:

```bash
git add .
git commit -m "Implement Groww API integration for accurate stock data"
git push origin main
```

Vercel will auto-deploy with your new environment variables.

## What You'll Get

✅ **Professional Trading Platform Accuracy** - Same data quality as Groww app  
✅ **Real-time Data** - Updates every 10 seconds  
✅ **Low Latency** - Direct API calls to Groww servers  
✅ **Bulk Data Loading** - Up to 50 instruments per request  
✅ **Professional Market Depth** - Bid/ask prices, volumes, OHLC data  

## Current Status

- **Without API keys**: Shows yellow "⚠️ Basic Data Mode" banner, uses free APIs
- **With API keys**: Shows green "🚀 Professional Grade Data" banner, uses Groww API

## Cost

- **₹499 + taxes per month** for Groww API subscription
- **Significant accuracy improvement** compared to free APIs

## Verification

1. **Local testing**: Run `npm start` and check the banner color
   - 🟡 Yellow = Using free APIs (basic accuracy)  
   - 🟢 Green = Using Groww API (professional accuracy)

2. **Production testing**: Check your deployed site for the same banner

## Need Help?

The system automatically falls back to free APIs if Groww credentials are missing, so your site will always work. The banner will clearly show which data source is being used.