#!/bin/bash

# Setup script for local testing of Groww Authentication Service
# This script helps you set up the environment for testing locally before Railway deployment

echo "🚀 Setting up Groww Authentication Service for local testing"
echo "============================================================"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or later."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3."
    exit 1
fi

echo "✅ pip3 found"

# Create virtual environment
echo "🔧 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "✅ Dependencies installed successfully!"

# Check for environment variables
echo ""
echo "🔍 Checking environment configuration..."

if [ -z "$GROWW_API_KEY" ]; then
    echo "⚠️  GROWW_API_KEY not set"
    echo "   Set it with: export GROWW_API_KEY='your_api_key_here'"
else
    echo "✅ GROWW_API_KEY is set"
fi

if [ -z "$GROWW_API_SECRET" ]; then
    echo "⚠️  GROWW_API_SECRET not set"
    echo "   Set it with: export GROWW_API_SECRET='your_totp_secret_here'"
else
    echo "✅ GROWW_API_SECRET is set"
fi

echo ""
echo "🎯 Setup complete! Next steps:"
echo ""
echo "1. Set your environment variables (if not already set):"
echo "   export GROWW_API_KEY='your_api_key_from_groww'"
echo "   export GROWW_API_SECRET='your_totp_secret_from_groww'"
echo ""
echo "2. Start the service:"
echo "   python app.py"
echo ""
echo "3. Test the service:"
echo "   python test_auth.py"
echo ""
echo "4. The service will be available at: http://localhost:8080"
echo ""
echo "🚀 Ready for testing!"