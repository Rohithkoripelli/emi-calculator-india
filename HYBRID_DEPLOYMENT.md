# 🌤️ Hybrid Multi-Cloud Deployment Guide

## Enterprise Architecture: Google Cloud Functions + Vercel

This guide shows how to deploy a **Google/Meta-level enterprise authentication system** using:
- **Google Cloud Functions**: Python TOTP authentication service
- **Vercel**: React frontend + Node.js data APIs

---

## 🏗️ Architecture Overview

```
React Frontend (Vercel) 
    ↓
Node.js Data APIs (Vercel) 
    ↓
Google Cloud Functions (Python TOTP Auth)
    ↓
Official Groww Python SDK
    ↓
Groww API with Bearer Tokens
```

### **Benefits:**
- ✅ **Reliability**: Multi-cloud fault tolerance
- ✅ **Performance**: Each service optimized for its cloud
- ✅ **Cost**: Pay-per-use for authentication, free tier for frontend
- ✅ **Future-Proof**: TOTP authentication ready before access token deprecation

---

## 🚀 Step 1: Deploy Google Cloud Functions (Python TOTP Service)

### **Prerequisites:**
- Google Cloud account with billing enabled
- `gcloud` CLI installed and authenticated
- Groww API credentials (API_KEY + TOTP_SECRET)

### **1.1 Setup Google Cloud Project:**

```bash
# Create new project (or use existing)
export GOOGLE_CLOUD_PROJECT="your-project-id"
gcloud projects create $GOOGLE_CLOUD_PROJECT
gcloud config set project $GOOGLE_CLOUD_PROJECT

# Enable required APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### **1.2 Set Environment Variables:**

```bash
# Set your Groww API credentials
export GROWW_API_KEY="your_groww_api_key"
export GROWW_TOTP_SECRET="your_groww_totp_secret"

# Verify they're set
echo "API Key: ${GROWW_API_KEY:0:20}..."
echo "TOTP Secret: ${GROWW_TOTP_SECRET:0:15}..."
```

### **1.3 Deploy to Google Cloud Functions:**

```bash
# Navigate to the auth service directory
cd gcp-auth-service

# Deploy the function
./deploy.sh
```

### **1.4 Test the Deployed Function:**

```bash
# Get your function URL
FUNCTION_URL="https://us-central1-${GOOGLE_CLOUD_PROJECT}.cloudfunctions.net/groww-totp-auth"

# Test health endpoint
curl "$FUNCTION_URL/health"

# Test token generation
curl "$FUNCTION_URL/token"
```

**Expected Response:**
```json
{
  "success": true,
  "token": "your_generated_bearer_token...",
  "source": "generated", 
  "method": "official_groww_python_sdk",
  "processing_time_ms": 1250,
  "cloud_provider": "google_cloud_functions"
}
```

---

## 🔗 Step 2: Configure Vercel Integration

### **2.1 Set Vercel Environment Variables:**

In your Vercel dashboard, add these environment variables:

```bash
# Google Cloud Functions Integration
GCP_AUTH_SERVICE_URL = "https://us-central1-your-project.cloudfunctions.net/groww-totp-auth"

# Fallback Manual Token (Optional)
REACT_APP_GROWW_ACCESS_TOKEN = "your_manual_token_for_fallback"

# Keep existing variables for frontend
REACT_APP_GROWW_API_KEY = "your_api_key"
REACT_APP_GROWW_TOTP_SECRET = "your_totp_secret"
```

### **2.2 Deploy Updated Vercel Code:**

The code is already updated to use the hybrid authentication flow. Just deploy:

```bash
# Commit the updated integration code
git add api/groww-data-bearer.js
git commit -m "HYBRID: Integrate Google Cloud Functions TOTP authentication"
git push origin main
```

Vercel will automatically deploy the updated Node.js APIs.

---

## 🧪 Step 3: Test End-to-End Authentication

### **3.1 Test Authentication Flow:**

```bash
# Test the Vercel API that uses GCP authentication
curl "https://emi-calculator-india.vercel.app/api/groww-data-bearer?symbol=HDFCBANK&type=quote"
```

**Expected Flow:**
1. Vercel Node.js API called
2. Calls Google Cloud Functions for token
3. GCP generates TOTP + calls Groww SDK
4. Returns Bearer token to Vercel
5. Vercel makes authenticated Groww API call
6. Returns stock data to frontend

### **3.2 Monitor Logs:**

**Google Cloud Functions Logs:**
```bash
gcloud functions logs read groww-totp-auth --limit=50
```

**Vercel Logs:**
Check the Functions tab in your Vercel dashboard

---

## 📊 Step 4: Production Monitoring

### **4.1 Google Cloud Monitoring:**

```bash
# View function metrics
gcloud functions describe groww-totp-auth --region=us-central1
```

### **4.2 Set Up Alerts:**

**Google Cloud Console** → **Monitoring** → **Alerting**

Create alerts for:
- Function failures > 5%
- Response time > 10 seconds
- Error rate spikes

### **4.3 Health Checks:**

```bash
# Add to your monitoring system
curl -f "$GCP_FUNCTION_URL/health" || alert "GCP Auth Service Down"
```

---

## 🔧 Step 5: Advanced Configuration

### **5.1 CORS Configuration:**

The service is configured to allow all origins. For production, restrict to your domain:

```python
# In main.py, update CORS configuration:
CORS(app, origins=["https://emi-calculator-india.vercel.app"])
```

### **5.2 Custom Domain (Optional):**

```bash
# Map to custom domain
gcloud functions add-iam-policy-binding groww-totp-auth \
    --region=us-central1 \
    --member="allUsers" \
    --role="roles/cloudfunctions.invoker"
```

### **5.3 Enhanced Security:**

```bash
# Create service account for function
gcloud iam service-accounts create groww-auth-service \
    --display-name="Groww Authentication Service"

# Grant minimal required permissions
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member="serviceAccount:groww-auth-service@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com" \
    --role="roles/cloudfunctions.invoker"
```

---

## 💰 Cost Optimization

### **Google Cloud Functions:**
- **Free Tier**: 2 million invocations/month
- **Paid**: $0.0000004 per invocation + $0.0000025 per GB-second
- **Estimated Cost**: ~$1-5/month for typical usage

### **Vercel:**
- **Hobby Plan**: Free (sufficient for this setup)
- **Pro Plan**: $20/month (if you need more)

---

## 🔥 Performance Benchmarks

**Expected Performance:**
- **Token Generation**: 800-2000ms (first TOTP generation)
- **Cached Token**: 100-300ms (subsequent calls)  
- **End-to-End API**: 1-3 seconds (including Groww API)
- **Cold Start**: 2-5 seconds (Google Cloud Functions warmup)

**Optimization:**
- Tokens cached for 11 hours (reduces API calls)
- Functions stay warm with regular usage
- Multiple fallback layers ensure availability

---

## 🚨 Troubleshooting

### **Common Issues:**

**1. Function Deploy Fails:**
```bash
# Check logs
gcloud functions logs read groww-totp-auth --limit=10

# Verify permissions
gcloud auth list
gcloud config list
```

**2. Environment Variables:**
```bash
# Check function env vars
gcloud functions describe groww-totp-auth --region=us-central1
```

**3. CORS Issues:**
```bash
# Test with curl first
curl -H "Origin: https://emi-calculator-india.vercel.app" \
     "$FUNCTION_URL/token"
```

**4. Token Generation Fails:**
```bash
# Test locally first
cd gcp-auth-service
python main.py
curl localhost:8080/token
```

---

## 🎯 Next Steps

1. **Deploy to Production**: Follow steps above
2. **Monitor Performance**: Set up alerts and dashboards  
3. **Optimize Costs**: Monitor usage and adjust resources
4. **Scale Horizontally**: Add more regions if needed
5. **Enhanced Security**: Implement API keys, rate limiting

**You now have a Google/Meta-level enterprise authentication system that's future-proof and production-ready!** 🚀

---

## 📞 Support

- **Google Cloud Functions**: [Official Documentation](https://cloud.google.com/functions/docs)
- **Vercel**: [Official Documentation](https://vercel.com/docs)
- **Groww API**: [Official Documentation](https://groww.in/trade-api/docs)