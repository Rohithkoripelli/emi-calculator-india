# 🚀 Groww API Automated Token Management Setup

This guide helps you set up automated token generation for Groww API, eliminating the need to manually update tokens daily.

## 📋 Prerequisites

1. **Groww Trading Account**: You need an active Groww trading account
2. **API Access**: Enable API access in your Groww account
3. **API Credentials**: Get your API Key and TOTP Secret

## 🔧 Step-by-Step Setup

### Step 1: Get Your API Credentials

1. Visit [Groww API Dashboard](https://groww.in/trade-api/dashboard)
2. Login with your Groww credentials
3. Navigate to **API Keys** section
4. Generate/copy your:
   - **API Key** (starts with `eyJraWQi...`)
   - **TOTP Secret** (Base32 string like `RIKJ6DLTOKBLXQTQFQPWQJGTPGSPXQNU`)

### Step 2: Add Environment Variables

#### For Local Development:
Add to your `.env` file:
```env
REACT_APP_GROWW_API_KEY=eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9...
REACT_APP_GROWW_TOTP_SECRET=RIKJ6DLTOKBLXQTQFQPWQJGTPGSPXQNU
```

#### For Vercel Deployment:
1. Go to your Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables for **Production**, **Preview**, and **Development**:
   ```
   REACT_APP_GROWW_API_KEY=your_api_key_here
   REACT_APP_GROWW_TOTP_SECRET=your_totp_secret_here
   ```

### Step 3: Test the Setup

1. **Start your application**:
   ```bash
   npm start
   ```

2. **Check browser console** for initialization messages:
   ```
   🚀 Initializing Groww API token management...
   ✅ Groww API credentials found, setting up automated token management
   🔐 Generated TOTP: 123456
   ✅ Successfully obtained new Groww access token
   ```

3. **Test manually in console**:
   ```javascript
   // Test token generation
   GrowwApiUtils.testTokenGeneration()
   
   // Check token status
   GrowwApiUtils.getTokenStatus()
   
   // Force refresh token
   GrowwApiUtils.refreshToken()
   ```

## 🤖 How It Works

### Automated Token Generation
- **TOTP Generation**: Creates time-based one-time passwords using your secret
- **Token Request**: Calls Groww API with API Key + TOTP to get access token
- **Auto Refresh**: Tokens are automatically refreshed every 10 hours (they expire after 11 hours)
- **Fallback Support**: Falls back to manual tokens if automated generation fails

### Token Lifecycle
```
App Startup → Generate TOTP → Request Token → Use Token → Auto Refresh (10hr) → Repeat
```

## 🔍 Troubleshooting

### Issue: "TOTP secret not configured"
**Solution**: Ensure `REACT_APP_GROWW_TOTP_SECRET` is set correctly in environment variables.

### Issue: "API key not configured"
**Solution**: Ensure `REACT_APP_GROWW_API_KEY` is set correctly in environment variables.

### Issue: "Failed to get access token: 401"
**Possible causes**:
- Invalid API key
- Invalid TOTP secret
- API key expired or revoked
- Time sync issues (TOTP is time-sensitive)

**Solution**: 
1. Verify credentials in Groww dashboard
2. Ensure system time is accurate
3. Regenerate API credentials if needed

### Issue: "API call returned 403"
**Solution**: Your API key may not have the required permissions. Contact Groww support.

## 📊 Testing Commands

Use these commands in browser console:

```javascript
// Test complete system
await GrowwApiUtils.testTokenGeneration()

// Check current token status
await GrowwApiUtils.getTokenStatus()

// Force token refresh
await GrowwApiUtils.refreshToken()

// Update backend with fresh token
await GrowwApiUtils.updateBackendToken()
```

## 🔒 Security Best Practices

1. **Never commit credentials**: Keep API keys and TOTP secrets in environment variables only
2. **Use different credentials**: Use separate API keys for development and production
3. **Monitor usage**: Check Groww dashboard for API usage and any suspicious activity
4. **Rotate credentials**: Periodically rotate your API credentials for security

## 📚 Documentation References

- [Groww API Python SDK](https://groww.in/trade-api/docs/python-sdk)
- [Groww API cURL Examples](https://groww.in/trade-api/docs/curl)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)

## 🎯 Benefits

✅ **No more daily manual updates**  
✅ **Automatic token refresh every 10 hours**  
✅ **Fallback to manual tokens if needed**  
✅ **Professional error handling and logging**  
✅ **Easy testing and debugging tools**  
✅ **Secure credential management**  

---

🚀 **You're all set!** Your Groww API tokens will now be generated and refreshed automatically, eliminating the daily 6 AM token expiry hassle.