# Groww Authentication Service - Railway Deployment Guide

This guide will help you deploy a dedicated Python authentication service on Railway to handle Groww API authentication using API Key + TOTP mechanism.

## 🎯 Overview

Instead of dealing with daily token expiration at 6 AM, this solution provides:
- **Automated TOTP-based authentication** using your API Key + Secret
- **On-demand access token generation** through dedicated backend service
- **Railway deployment** with proper environment management
- **Seamless integration** with your existing React/Next.js frontend

## 📋 Prerequisites

1. **Groww API Credentials**
   - API Key from your Groww dashboard
   - TOTP Secret from your Groww dashboard
   
2. **Railway Account**
   - Your Railway account is already authenticated with GitHub
   
3. **GitHub Repository**
   - The `groww-auth-service` folder needs to be in your repository

## 🚀 Quick Setup Steps

### Step 1: Get Your Groww API Credentials

1. Go to [Groww API Dashboard](https://groww.in/trade-api/)
2. Navigate to your API settings
3. Copy your **API Key**
4. Copy your **TOTP Secret** (also called API Secret)

> ⚠️ **Important**: Keep these credentials secure. Never commit them to your repository.

### Step 2: Test Locally (Optional but Recommended)

Before deploying to Railway, test locally:

```bash
# Navigate to the auth service directory
cd groww-auth-service

# Set your environment variables
export GROWW_API_KEY='your_api_key_here'
export GROWW_API_SECRET='your_totp_secret_here'

# Run the setup script
./setup_local_test.sh

# Start the service
python app.py

# In another terminal, test the service
python test_auth.py
```

### Step 3: Deploy to Railway

1. **Create New Project on Railway**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Set the root directory to `groww-auth-service`

2. **Configure Environment Variables**
   In Railway project settings, add these environment variables:
   ```
   GROWW_API_KEY=your_actual_api_key
   GROWW_API_SECRET=your_actual_totp_secret
   FLASK_ENV=production
   PORT=8080
   ```

3. **Deploy**
   - Railway will automatically deploy using the `railway.json` configuration
   - Wait for deployment to complete
   - Note down your Railway app URL (e.g., `https://your-app-name.railway.app`)

### Step 4: Update Your Frontend

1. **Add the auth service URL to your environment variables**:
   ```bash
   # In your React/Next.js app's .env file
   REACT_APP_GROWW_AUTH_SERVICE_URL=https://your-app-name.railway.app
   # OR for Next.js:
   NEXT_PUBLIC_GROWW_AUTH_SERVICE_URL=https://your-app-name.railway.app
   ```

2. **Update your Groww service to use the new auth client**:
   ```typescript
   // In your growwApiService.ts or similar file
   import { GrowwAuthClient } from './growwAuthClient';

   // Replace your old token management with:
   const authClient = GrowwAuthClient.getInstance();
   const accessToken = await authClient.getAccessToken();
   ```

## 📡 API Endpoints

Your deployed service will have these endpoints:

- `GET /` - Health check
- `GET /auth/status` - Service status and configuration
- `POST /auth/token` - Get access token (main endpoint)
- `POST /auth/test` - Test authentication flow

## 🧪 Testing Your Deployment

After deployment, test your service:

```bash
# Test health check
curl https://your-app-name.railway.app/

# Test status
curl https://your-app-name.railway.app/auth/status

# Test token generation
curl -X POST https://your-app-name.railway.app/auth/token
```

## 🔧 Integration with Your Application

Replace your current token management code with the new auth client:

```typescript
// Old code (replace this):
const tokenManager = GrowwTokenManager.getInstance();
const accessToken = await tokenManager.getAccessToken();

// New code (use this):
import { GrowwAuthClient } from './growwAuthClient';
const authClient = GrowwAuthClient.getInstance();
const accessToken = await authClient.getAccessToken();
```

## 🛡️ Security Best Practices

1. **Environment Variables**: Never hardcode API credentials
2. **HTTPS**: Railway provides HTTPS by default
3. **CORS**: Service is configured to handle CORS properly
4. **Token Caching**: Tokens are cached and refreshed automatically
5. **Error Handling**: Comprehensive error handling and fallbacks

## 🚨 Troubleshooting

### Common Issues:

1. **"Authentication service not configured"**
   - Check that `GROWW_API_KEY` and `GROWW_API_SECRET` are set in Railway
   - Verify the values are correct (no extra spaces/quotes)

2. **"Network error fetching access token"**
   - Check Railway deployment logs
   - Verify your API credentials are valid
   - Ensure Groww API endpoint is accessible

3. **"TOTP generation failed"**
   - Verify your `GROWW_API_SECRET` is the correct TOTP secret
   - Check that system time is synchronized

4. **CORS issues**
   - The service has CORS enabled by default
   - If issues persist, check your frontend domain configuration

### Debugging:

1. **Check Railway Logs**:
   ```bash
   # In Railway dashboard, go to your project
   # Click on "View Logs" to see real-time logs
   ```

2. **Test Service Status**:
   ```bash
   curl https://your-app-name.railway.app/auth/status
   ```

3. **Test from Frontend**:
   ```typescript
   const authClient = GrowwAuthClient.getInstance();
   const isWorking = await authClient.testService();
   console.log('Auth service working:', isWorking);
   ```

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GROWW_API_KEY` | Your Groww API key | `gw_xxxxxxxxxxxxx` |
| `GROWW_API_SECRET` | Your Groww TOTP secret | `ABCDEFGHIJKLMNOP` |
| `FLASK_ENV` | Flask environment | `production` |
| `PORT` | Service port (Railway sets this) | `8080` |

## 🔄 Token Lifecycle

1. **Frontend requests data** → Calls your service
2. **Service checks token** → Uses cached if valid
3. **If expired** → Generates new TOTP code
4. **Fetches new token** → From Groww API
5. **Caches token** → For subsequent requests
6. **Returns data** → To your frontend

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Railway deployment logs
3. Test the service endpoints directly with curl
4. Verify your Groww API credentials are correct and active

## 🎉 Success!

Once deployed, your application will:
- ✅ Automatically handle token expiration
- ✅ Generate tokens on-demand using TOTP
- ✅ Work 24/7 without daily 6 AM disruptions
- ✅ Provide reliable authentication for all your Groww API calls

The service is now running on Railway and ready to handle all your Groww API authentication needs!