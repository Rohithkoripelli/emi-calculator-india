#!/usr/bin/env python3
"""
Test script for Groww Authentication Service
Run this locally to test the authentication flow before deploying
"""

import os
import sys
import requests
import json
from datetime import datetime

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_local_service():
    """Test the locally running service"""
    base_url = "http://localhost:8080"
    
    print("🧪 Testing Groww Authentication Service")
    print("=" * 50)
    
    # Test health check
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Could not connect to service: {e}")
        print("   Make sure the service is running with: python app.py")
        return False
    
    # Test status endpoint
    try:
        response = requests.get(f"{base_url}/auth/status")
        if response.status_code == 200:
            status_data = response.json()
            print("✅ Status endpoint working")
            print(f"   Service configured: {status_data['status']['configured']}")
            print(f"   Has token: {status_data['status']['has_token']}")
            print(f"   Token valid: {status_data['status']['is_token_valid']}")
        else:
            print(f"❌ Status check failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Status check error: {e}")
    
    # Test authentication flow
    try:
        response = requests.post(f"{base_url}/auth/test")
        if response.status_code == 200:
            test_data = response.json()
            if test_data['success']:
                print("✅ Authentication test passed")
                print(f"   TOTP generated: {test_data['totp_generated']}")
                print(f"   Token obtained: {test_data['token_obtained']}")
            else:
                print(f"⚠️  Authentication test failed: {test_data['error']}")
        else:
            print(f"❌ Authentication test failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Authentication test error: {e}")
    
    # Test token generation
    try:
        response = requests.post(f"{base_url}/auth/token")
        if response.status_code == 200:
            token_data = response.json()
            if token_data['success']:
                print("✅ Token generation successful")
                print(f"   Access token: {token_data['access_token'][:20]}...")
                print(f"   Expires at: {token_data['expires_at']}")
            else:
                print(f"⚠️  Token generation failed: {token_data['error']}")
        else:
            print(f"❌ Token generation failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Token generation error: {e}")
    
    print("=" * 50)
    print("🔧 Test completed")
    return True

def check_environment():
    """Check if required environment variables are set"""
    print("🔍 Checking environment configuration")
    print("=" * 30)
    
    api_key = os.getenv('GROWW_API_KEY')
    api_secret = os.getenv('GROWW_API_SECRET')
    
    if api_key:
        print(f"✅ GROWW_API_KEY: {api_key[:10]}...")
    else:
        print("❌ GROWW_API_KEY: Not set")
    
    if api_secret:
        print(f"✅ GROWW_API_SECRET: {api_secret[:10]}...")
    else:
        print("❌ GROWW_API_SECRET: Not set")
    
    if not api_key or not api_secret:
        print("⚠️  Missing credentials. Set environment variables:")
        print("   export GROWW_API_KEY='your_api_key'")
        print("   export GROWW_API_SECRET='your_totp_secret'")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Groww Authentication Service Test")
    print()
    
    # Check environment first
    env_ok = check_environment()
    print()
    
    if not env_ok:
        print("❌ Environment check failed. Please set the required environment variables.")
        sys.exit(1)
    
    # Test the service
    success = test_local_service()
    
    if success:
        print("✅ All tests completed successfully!")
    else:
        print("❌ Some tests failed. Check the service and try again.")
        sys.exit(1)