# Vercel Deployment Guide - Enhanced Stock Analysis System

## Overview

This guide covers deploying your EMI Calculator with enhanced stock analysis features to Vercel, including serverless functions for stock data scraping and analysis.

## 🚀 Quick Deployment Steps

### 1. Prerequisites

- ✅ GitHub repository with your code
- ✅ Vercel account connected to GitHub
- ✅ Google Custom Search API credentials
- ✅ OpenAI API key

### 2. Environment Variables Setup

#### In Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add the following variables for **Production**, **Preview**, and **Development**:

```bash
# Google Custom Search API
GOOGLE_SEARCH_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
REACT_APP_GOOGLE_SEARCH_API_KEY=your_google_api_key_here
REACT_APP_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here

# OpenAI API
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

#### Important Notes:
- Use both `GOOGLE_SEARCH_API_KEY` and `REACT_APP_GOOGLE_SEARCH_API_KEY` formats
- The `REACT_APP_` prefixed variables are for React frontend
- The non-prefixed variables are for serverless functions

### 3. Deploy to Vercel

#### Option A: Automatic Deployment (Recommended)

1. **Connect GitHub to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings (should auto-detect React)

2. **Deploy:**
   - Vercel will automatically deploy on every push to main branch
   - GitHub Actions will handle testing and deployment

#### Option B: Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
cd emi-calculator-app
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Set up environment variables
# - Deploy
```

### 4. Verify Deployment

After deployment, test these endpoints:

1. **Main App:** `https://your-app.vercel.app`
2. **Enhanced Stock Search:** `https://your-app.vercel.app/api/enhanced-stock-search`
3. **Python Scraper:** `https://your-app.vercel.app/api/scrape-stock`

#### Test Stock Analysis:

Try these queries in your AI assistant:
- "Should I buy TCS stock?"
- "Analysis of Reliance Industries"
- "Is HDFC Bank a good investment?"

## 🔧 Technical Configuration

### Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "env": {
    "CI": "false"
  },
  "functions": {
    "api/scrape-stock.py": {
      "runtime": "python3.9"
    }
  },
  "rewrites": [
    {
      "source": "/api/scrape-stock",
      "destination": "/api/scrape-stock.py"
    },
    {
      "source": "/((?!api).*)",
      "destination": "/index.html"
    }
  ]
}
```

### Serverless Functions

Your app includes two serverless functions:

1. **`/api/enhanced-stock-search.js`** - JavaScript-based comprehensive stock search
2. **`/api/scrape-stock.py`** - Python-based BeautifulSoup scraper

### Fallback Strategy

The system uses a tiered approach:
1. **Vercel Enhanced Search** (JavaScript) - Primary
2. **Vercel Python Scraper** (Python) - Secondary  
3. **CORS Proxy Fallback** (Client-side) - Tertiary

## 🛠️ GitHub Integration

### Automatic Deployment

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) provides:

- ✅ Automated testing on push/PR
- ✅ Type checking with TypeScript
- ✅ Automatic Vercel deployment
- ✅ Preview deployments for PRs

### GitHub Secrets Setup

Add these secrets to your GitHub repository:

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add these secrets:

```bash
# Vercel Integration
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# API Keys
REACT_APP_GOOGLE_SEARCH_API_KEY=your_google_api_key
REACT_APP_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
REACT_APP_OPENAI_API_KEY=your_openai_api_key
```

#### Get Vercel Integration Values:

```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Get project details
vercel env ls

# Get org and project IDs from .vercel/project.json
cat .vercel/project.json
```

## 🔍 Testing & Monitoring

### Health Checks

Monitor these endpoints:

```bash
# Test enhanced search
curl -X POST https://your-app.vercel.app/api/enhanced-stock-search \
  -H "Content-Type: application/json" \
  -d '{"symbol":"TCS","companyName":"Tata Consultancy Services"}'

# Test Python scraper
curl -X POST https://your-app.vercel.app/api/scrape-stock \
  -H "Content-Type: application/json" \
  -d '{"symbol":"TCS","company_name":"Tata Consultancy Services"}'
```

### Performance Monitoring

- **Vercel Analytics**: Enable in Vercel dashboard
- **Function Logs**: Check Vercel Functions tab
- **Error Tracking**: Monitor Vercel Functions logs for errors

### Expected Response Times

- Enhanced Search: 2-5 seconds
- Python Scraper: 3-8 seconds  
- Fallback Methods: 1-3 seconds

## 🐛 Troubleshooting

### Common Issues

#### 1. Environment Variables Not Working

**Problem:** API calls failing with authentication errors

**Solution:**
```bash
# Verify environment variables in Vercel dashboard
# Make sure you have both formats:
GOOGLE_SEARCH_API_KEY=xxx           # For serverless functions
REACT_APP_GOOGLE_SEARCH_API_KEY=xxx # For React frontend
```

#### 2. Python Function Not Working

**Problem:** `/api/scrape-stock` returns 500 error

**Check:**
- `requirements.txt` is in root directory
- Python function has proper imports
- Vercel supports the Python packages used

**Solution:**
```bash
# Test locally first
python api/scrape-stock.py

# Check Vercel function logs
vercel logs
```

#### 3. CORS Issues

**Problem:** API calls blocked by CORS

**Solution:** Already configured in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {"key": "Access-Control-Allow-Origin", "value": "*"},
        {"key": "Access-Control-Allow-Methods", "value": "POST, OPTIONS"},
        {"key": "Access-Control-Allow-Headers", "value": "Content-Type"}
      ]
    }
  ]
}
```

#### 4. Build Failures

**Problem:** Deployment fails during build

**Common Causes:**
- Missing dependencies in `package.json`
- TypeScript errors
- Environment variables not set

**Solution:**
```bash
# Test build locally
npm run build

# Check build logs in Vercel dashboard
# Fix any TypeScript or dependency issues
```

### Performance Optimization

#### Function Timeout Issues

If serverless functions timeout:

1. **Optimize Python scraper:**
   - Reduce number of sites scraped
   - Add timeout limits to requests
   - Use faster parsing methods

2. **Use caching:**
   ```javascript
   // Add caching headers in API responses
   res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
   ```

#### API Rate Limits

Monitor API usage:
- **Google Custom Search**: 100 free queries/day
- **OpenAI**: Based on your plan
- **Web scraping**: Be respectful with request frequency

## 📊 Production Checklist

### Before Going Live:

- [ ] All environment variables configured in Vercel
- [ ] GitHub Actions secrets added
- [ ] API credentials valid and have sufficient quota
- [ ] Test stock queries working end-to-end
- [ ] Error handling working properly
- [ ] Performance acceptable (< 10 second response times)
- [ ] Monitoring set up (Vercel Analytics)

### Post-Deployment:

- [ ] Test various stock symbols (TCS, RELIANCE, HDFCBANK)
- [ ] Verify AI recommendations are generated
- [ ] Check that web insights are populated
- [ ] Monitor error rates in Vercel dashboard
- [ ] Set up alerts for function failures

## 🔗 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Google Custom Search API](https://developers.google.com/custom-search/v1/introduction)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [GitHub Actions for Vercel](https://github.com/amondnet/vercel-action)

## 📞 Support

If you encounter issues:

1. Check Vercel function logs
2. Verify environment variables
3. Test API endpoints individually
4. Review this guide's troubleshooting section
5. Check the console logs in your browser

Your enhanced stock analysis system should now be fully deployed and operational on Vercel! 🎉