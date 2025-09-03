#!/usr/bin/env python3
"""
Groww API TOTP Authentication Test Script
Tests API Key + TOTP authentication and fetches HDFC Bank live data

Prerequisites:
pip install pyotp growwapi requests

Usage:
python test_groww_totp_simulation.py
"""

import os
import sys
import json
from datetime import datetime

def test_imports():
    """Test if required libraries are available"""
    print("🔍 Testing Python dependencies...")
    
    try:
        import pyotp
        print("✅ pyotp library available")
    except ImportError:
        print("❌ pyotp not installed. Run: pip install pyotp")
        return False
        
    try:
        import requests
        print("✅ requests library available")
    except ImportError:
        print("❌ requests not installed. Run: pip install requests")
        return False
        
    try:
        from growwapi import GrowwAPI
        print("✅ growwapi library available")
    except ImportError:
        print("❌ growwapi not installed. Run: pip install growwapi")
        print("💡 Or try: pip install --upgrade growwapi")
        return False
        
    return True

def load_credentials():
    """Load API credentials from environment or .env file"""
    print("🔑 Loading Groww API credentials...")
    
    # Try to load from .env file if available
    env_file_path = ".env"
    if os.path.exists(env_file_path):
        print("📁 Found .env file, loading credentials...")
        with open(env_file_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value
    
    # Get credentials from environment
    api_key = os.environ.get('REACT_APP_GROWW_API_KEY') or os.environ.get('GROWW_API_KEY')
    api_secret = os.environ.get('REACT_APP_GROWW_API_SECRET') or os.environ.get('GROWW_API_SECRET')
    
    if not api_key:
        print("❌ API Key not found. Set REACT_APP_GROWW_API_KEY or GROWW_API_KEY")
        print("💡 Expected in .env file or environment variables")
        return None, None
        
    if not api_secret:
        print("❌ API Secret not found. Set REACT_APP_GROWW_API_SECRET or GROWW_API_SECRET")
        print("💡 Expected in .env file or environment variables")
        return None, None
    
    print(f"✅ API Key loaded: {api_key[:20]}...")
    print(f"✅ API Secret loaded: {api_secret[:10]}...")
    
    return api_key, api_secret

def generate_totp(api_secret):
    """Generate TOTP using API secret"""
    import pyotp
    
    print("🔐 Generating TOTP...")
    
    try:
        totp_gen = pyotp.TOTP(api_secret)
        totp = totp_gen.now()
        
        print(f"✅ TOTP generated: {totp}")
        print(f"🕐 Valid for ~{30 - (datetime.now().second % 30)} seconds")
        
        return totp
    except Exception as e:
        print(f"❌ TOTP generation failed: {e}")
        return None

def test_authentication(api_key, totp):
    """Test authentication using API key and TOTP"""
    from growwapi import GrowwAPI
    
    print("🔄 Testing Groww API authentication...")
    
    try:
        # Get access token
        print("📞 Requesting access token from Groww...")
        access_token = GrowwAPI.get_access_token(api_key, totp)
        
        if not access_token:
            print("❌ Failed to get access token")
            return None
            
        print("✅ Access token obtained successfully!")
        print(f"🎟️  Token preview: {access_token[:50]}...")
        
        # Initialize GrowwAPI client
        print("🚀 Initializing Groww API client...")
        growwapi = GrowwAPI(access_token)
        
        return growwapi
        
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        print(f"🔍 Error type: {type(e).__name__}")
        return None

def test_hdfc_data(growwapi):
    """Test fetching HDFC Bank live stock data"""
    print("📊 Testing HDFC Bank live data fetch...")
    
    # Common HDFC Bank identifiers to try
    hdfc_identifiers = [
        'HDFCBANK',
        'HDFC',
        'hdfcbank',
        'INE040A01034',  # ISIN code
    ]
    
    for identifier in hdfc_identifiers:
        print(f"🔍 Trying HDFC identifier: {identifier}")
        
        try:
            # Try different methods available in GrowwAPI
            methods_to_try = [
                ('get_ltp', 'Last Traded Price'),
                ('get_quote', 'Full Quote'),
                ('get_market_data', 'Market Data'),
                ('get_instrument_data', 'Instrument Data'),
            ]
            
            for method_name, description in methods_to_try:
                if hasattr(growwapi, method_name):
                    print(f"  📞 Trying {method_name} for {description}...")
                    
                    try:
                        method = getattr(growwapi, method_name)
                        result = method(identifier)
                        
                        if result:
                            print(f"  ✅ {description} success!")
                            print(f"  📊 Data: {json.dumps(result, indent=2, default=str)}")
                            return True
                        else:
                            print(f"  ⚠️  {description} returned empty result")
                            
                    except Exception as method_error:
                        print(f"  ❌ {description} failed: {method_error}")
                        
                else:
                    print(f"  ⚠️  Method {method_name} not available")
            
        except Exception as e:
            print(f"  ❌ Failed for identifier {identifier}: {e}")
    
    return False

def test_market_status(growwapi):
    """Test basic market status or available instruments"""
    print("🏪 Testing market status and available methods...")
    
    try:
        # List all available methods
        methods = [method for method in dir(growwapi) if not method.startswith('_')]
        print(f"📋 Available methods: {', '.join(methods[:10])}...")
        
        # Try some common methods
        test_methods = ['get_market_status', 'get_profile', 'get_holdings', 'get_instruments']
        
        for method_name in test_methods:
            if hasattr(growwapi, method_name):
                print(f"🔍 Testing {method_name}...")
                try:
                    method = getattr(growwapi, method_name)
                    result = method()
                    print(f"✅ {method_name} success: {type(result)}")
                    if result:
                        print(f"📊 Sample data: {str(result)[:200]}...")
                    return True
                except Exception as e:
                    print(f"❌ {method_name} failed: {e}")
            else:
                print(f"⚠️  {method_name} not available")
        
    except Exception as e:
        print(f"❌ Market status test failed: {e}")
    
    return False

def main():
    """Main test function"""
    print("🚀 Groww API TOTP Authentication Test")
    print("=" * 50)
    
    # Step 1: Test imports
    if not test_imports():
        print("\n❌ Prerequisites not met. Install required libraries first.")
        return False
    
    print("\n" + "=" * 50)
    
    # Step 2: Load credentials
    api_key, api_secret = load_credentials()
    if not api_key or not api_secret:
        print("\n❌ Credentials not available. Check environment variables.")
        return False
    
    print("\n" + "=" * 50)
    
    # Step 3: Generate TOTP
    totp = generate_totp(api_secret)
    if not totp:
        print("\n❌ TOTP generation failed.")
        return False
    
    print("\n" + "=" * 50)
    
    # Step 4: Test authentication
    growwapi = test_authentication(api_key, totp)
    if not growwapi:
        print("\n❌ Authentication failed.")
        return False
    
    print("\n" + "=" * 50)
    
    # Step 5: Test HDFC Bank data fetch
    hdfc_success = test_hdfc_data(growwapi)
    
    print("\n" + "=" * 50)
    
    # Step 6: Test general API functionality
    market_success = test_market_status(growwapi)
    
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    results = {
        "Dependencies": "✅ Available",
        "Credentials": "✅ Loaded",
        "TOTP Generation": "✅ Working",
        "Authentication": "✅ Successful",
        "HDFC Data": "✅ Success" if hdfc_success else "❌ Failed",
        "API Methods": "✅ Working" if market_success else "⚠️  Limited"
    }
    
    for test, status in results.items():
        print(f"{test:20}: {status}")
    
    overall_success = hdfc_success or market_success
    
    print("\n" + "=" * 50)
    if overall_success:
        print("🎉 OVERALL: SUCCESS - TOTP Authentication Working!")
        print("✅ Ready for production implementation")
        print("💡 Next step: Integrate this flow into your Node.js backend")
    else:
        print("⚠️  OVERALL: PARTIAL SUCCESS")
        print("✅ Authentication works, but data access needs refinement") 
        print("💡 May need to check API subscription status or data endpoints")
    
    return overall_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)