#!/bin/bash

# Google Cloud Functions Deployment Script
# Deploy Groww TOTP Authentication Service to GCP

echo "🚀 Deploying Groww TOTP Authentication Service to Google Cloud Functions..."

# Set variables
FUNCTION_NAME="groww-totp-auth"
REGION="us-central1"  # Choose region closest to your users
RUNTIME="python312"   # Python 3.12 runtime

# Check if required environment variables are set
if [ -z "$GROWW_API_KEY" ] || [ -z "$GROWW_TOTP_SECRET" ]; then
    echo "❌ Error: Please set GROWW_API_KEY and GROWW_TOTP_SECRET environment variables"
    echo "   Example:"
    echo "   export GROWW_API_KEY='your_api_key'"
    echo "   export GROWW_TOTP_SECRET='your_totp_secret'"
    exit 1
fi

echo "✅ Environment variables configured"
echo "🔧 Function: $FUNCTION_NAME"
echo "🌍 Region: $REGION" 
echo "🐍 Runtime: $RUNTIME"

# Deploy to Google Cloud Functions
gcloud functions deploy $FUNCTION_NAME \
    --gen2 \
    --runtime=$RUNTIME \
    --region=$REGION \
    --source=. \
    --entry-point=main \
    --trigger-http \
    --allow-unauthenticated \
    --timeout=300s \
    --memory=512MB \
    --max-instances=10 \
    --set-env-vars="GROWW_API_KEY=${GROWW_API_KEY},GROWW_TOTP_SECRET=${GROWW_TOTP_SECRET}" \
    --service-account="groww-auth-service@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com" \
    --description="Enterprise TOTP authentication service for Groww API integration"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "📋 Function URL: https://$REGION-${GOOGLE_CLOUD_PROJECT}.cloudfunctions.net/$FUNCTION_NAME"
    echo ""
    echo "🔍 Test endpoints:"
    echo "   Health: GET  /health"
    echo "   Token:  GET  /token"
    echo "   Status: GET  /status" 
    echo "   Force:  POST /generate"
    echo ""
    echo "📊 Monitor at: https://console.cloud.google.com/functions"
else
    echo "❌ Deployment failed!"
    exit 1
fi