#!/bin/bash

# Groww API TOTP Test Setup Script

echo "🚀 Setting up Groww API TOTP Test Environment"
echo "============================================="

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.9+ first."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required but not installed."
    echo "Please install pip3 first."
    exit 1
fi

echo "✅ pip3 found"

# Install required packages
echo ""
echo "📦 Installing required Python packages..."

echo "Installing pyotp..."
pip3 install pyotp>=2.6.0

echo "Installing requests..."
pip3 install requests>=2.25.0

echo "Installing growwapi..."
pip3 install growwapi

echo ""
echo "🔍 Verifying installation..."

# Test imports
python3 -c "
try:
    import pyotp
    print('✅ pyotp installed successfully')
except ImportError as e:
    print('❌ pyotp import failed:', e)

try:
    import requests
    print('✅ requests installed successfully') 
except ImportError as e:
    print('❌ requests import failed:', e)

try:
    from growwapi import GrowwAPI
    print('✅ growwapi installed successfully')
except ImportError as e:
    print('❌ growwapi import failed:', e)
    print('💡 Try: pip3 install --upgrade growwapi')
"

echo ""
echo "📋 Checking environment variables..."

if [ -f ".env" ]; then
    echo "✅ .env file found"
    if grep -q "REACT_APP_GROWW_API_KEY" .env; then
        echo "✅ GROWW_API_KEY found in .env"
    else
        echo "⚠️  GROWW_API_KEY not found in .env file"
    fi
    
    if grep -q "REACT_APP_GROWW_API_SECRET" .env; then
        echo "✅ GROWW_API_SECRET found in .env"
    else
        echo "⚠️  GROWW_API_SECRET not found in .env file"
    fi
else
    echo "⚠️  .env file not found"
    echo "💡 Make sure you have REACT_APP_GROWW_API_KEY and REACT_APP_GROWW_API_SECRET set"
fi

echo ""
echo "🎯 Setup complete! Run the test with:"
echo "python3 test_groww_totp_simulation.py"
echo ""
echo "If you encounter issues:"
echo "1. Make sure your .env file has the correct API credentials"
echo "2. Verify you have an active Groww Trading API subscription"
echo "3. Check that your API key and secret are correctly generated from Groww"