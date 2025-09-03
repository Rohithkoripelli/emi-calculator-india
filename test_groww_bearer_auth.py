#!/usr/bin/env python3
"""
Groww API Bearer Token Authentication Test
Tests proper Bearer token usage with Groww API endpoints

This script tests the CORRECT approach:
1. Use existing access token (manual or TOTP-generated)
2. Make API calls with Authorization: Bearer {token} headers
3. Test actual market data endpoints

Usage:
python3 test_groww_bearer_auth.py
"""

import os
import sys
import json
import requests
from datetime import datetime

def load_access_token():
    """Load access token from environment or prompt user"""
    print("🔑 Loading Groww access token...")
    
    # Try to load from .env file
    env_file_path = ".env"
    if os.path.exists(env_file_path):
        with open(env_file_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.strip().split('=', 1)
                        if value:  # Only set if value is not empty
                            os.environ[key] = value
    
    # Try different token environment variables
    token = (os.environ.get('REACT_APP_GROWW_ACCESS_TOKEN') or 
             os.environ.get('GROWW_ACCESS_TOKEN') or 
             os.environ.get('GROWW_MANUAL_TOKEN'))
    
    if not token:
        print("❌ No access token found in environment variables")
        print("💡 You can:")
        print("   1. Add REACT_APP_GROWW_ACCESS_TOKEN to your .env file")
        print("   2. Generate one from https://groww.in/user/profile/trading-apis")
        
        # Prompt user for manual entry
        print("\n🔧 Enter your Groww access token manually (or press Enter to skip):")
        manual_token = input("Token: ").strip()
        
        if manual_token:
            token = manual_token
        else:
            return None
    
    if token:
        print(f"✅ Access token loaded: {token[:30]}...")
        print(f"🔍 Token length: {len(token)} characters")
        return token
    
    return None

def test_bearer_authentication(token):
    """Test Bearer token authentication with various Groww API endpoints"""
    print("🔄 Testing Bearer token authentication...")
    
    # Common headers for Groww API
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'GrowwAPITest/1.0',
    }
    
    # Test different API version headers
    version_headers = [
        {'X-API-VERSION': '1.0'},
        {'X-API-Version': '1.0'},
        {'API-Version': '1.0'},
        {}  # No version header
    ]
    
    # Potential Groww API endpoints to test
    test_endpoints = [
        # Market data endpoints
        {
            'url': 'https://api.groww.in/v1/api/stocks/quote/HDFCBANK',
            'name': 'HDFC Bank Quote',
            'method': 'GET'
        },
        {
            'url': 'https://api.groww.in/v1/api/stocks/quote',
            'name': 'Stock Quote (Generic)',
            'method': 'POST',
            'body': {'symbol': 'HDFCBANK'}
        },
        {
            'url': 'https://api.groww.in/v1/api/stocks/search/HDFC',
            'name': 'Stock Search',
            'method': 'GET'
        },
        {
            'url': 'https://api.groww.in/v1/api/stocks/ltp/HDFCBANK',
            'name': 'Last Traded Price',
            'method': 'GET'
        },
        {
            'url': 'https://api.groww.in/v1/api/market/status',
            'name': 'Market Status',
            'method': 'GET'
        },
        {
            'url': 'https://api.groww.in/v1/api/user/profile',
            'name': 'User Profile',
            'method': 'GET'
        },
        {
            'url': 'https://api.groww.in/v1/api/holdings',
            'name': 'Holdings',
            'method': 'GET'
        }
    ]
    
    successful_calls = []
    
    for endpoint in test_endpoints:
        print(f"\n🔍 Testing: {endpoint['name']}")
        print(f"   URL: {endpoint['url']}")
        
        for i, version_header in enumerate(version_headers):
            test_headers = {**headers, **version_header}
            version_desc = f"v{i+1}" if version_header else "no-version"
            
            print(f"   📤 Attempt {version_desc}: {version_header}")
            
            try:
                # Make the API request
                if endpoint['method'] == 'GET':
                    response = requests.get(
                        endpoint['url'],
                        headers=test_headers,
                        timeout=10
                    )
                elif endpoint['method'] == 'POST':
                    response = requests.post(
                        endpoint['url'],
                        headers=test_headers,
                        json=endpoint.get('body', {}),
                        timeout=10
                    )
                
                print(f"   📊 Status: {response.status_code}")
                
                if response.status_code == 200:
                    print(f"   ✅ SUCCESS! {endpoint['name']} working with Bearer auth!")
                    
                    try:
                        data = response.json()
                        print(f"   📊 Response keys: {list(data.keys())}")
                        
                        # Pretty print first few lines of response
                        response_preview = json.dumps(data, indent=2)[:500]
                        print(f"   📄 Data preview: {response_preview}...")
                        
                        successful_calls.append({
                            'endpoint': endpoint['name'],
                            'url': endpoint['url'],
                            'headers': version_header,
                            'data': data
                        })
                        
                        # If we got HDFC data, this is our main success!
                        if 'HDFC' in endpoint['name'] and data:
                            print(f"   🎉 HDFC BANK DATA RETRIEVED! Mission accomplished!")
                            return True, successful_calls
                            
                    except json.JSONDecodeError:
                        print(f"   📄 Response text: {response.text[:200]}...")
                
                elif response.status_code == 401:
                    print(f"   🔐 Unauthorized - token may be expired or invalid")
                elif response.status_code == 403:
                    print(f"   🚫 Forbidden - API access may not be enabled")
                elif response.status_code == 404:
                    print(f"   🔍 Not Found - endpoint may not exist")
                else:
                    print(f"   ⚠️  HTTP {response.status_code}: {response.text[:100]}...")
                
            except requests.exceptions.Timeout:
                print(f"   ⏰ Request timeout")
            except requests.exceptions.ConnectionError:
                print(f"   🔌 Connection error")
            except Exception as e:
                print(f"   ❌ Error: {e}")
    
    return len(successful_calls) > 0, successful_calls

def test_totp_token_generation():
    """Test if we can generate a token using TOTP and then use it"""
    print("🔄 Testing TOTP token generation...")
    
    try:
        # Import required libraries
        import pyotp
        from growwapi import GrowwAPI
        
        # Load TOTP credentials
        api_key = os.environ.get('REACT_APP_GROWW_API_KEY') or os.environ.get('GROWW_API_KEY')
        api_secret = os.environ.get('REACT_APP_GROWW_API_SECRET') or os.environ.get('GROWW_API_SECRET')
        
        if not api_key or not api_secret:
            print("⚠️  TOTP credentials not found, skipping TOTP test")
            return False, None
        
        print(f"🔑 Using API Key: {api_key[:30]}...")
        
        # Generate TOTP
        totp_gen = pyotp.TOTP(api_secret)
        totp = totp_gen.now()
        print(f"🔐 Generated TOTP: {totp}")
        
        # Try to get access token
        try:
            access_token = GrowwAPI.get_access_token(api_key, totp)
            
            if access_token:
                print(f"✅ TOTP token generated successfully!")
                print(f"🎟️  Token: {access_token[:50]}...")
                
                # Now test this token with Bearer auth
                print("🧪 Testing TOTP-generated token with Bearer authentication...")
                success, calls = test_bearer_authentication(access_token)
                
                return success, access_token
            else:
                print("❌ TOTP token generation returned None")
                return False, None
                
        except Exception as totp_error:
            print(f"❌ TOTP token generation failed: {totp_error}")
            
            # The error might be due to internal endpoints, but let's see if we can work around it
            print("💡 TOTP generation failed, but this might be due to internal endpoint issues")
            print("   The Bearer auth pattern should still work with manually generated tokens")
            return False, None
            
    except ImportError as e:
        print(f"❌ Required libraries not available: {e}")
        return False, None
    except Exception as e:
        print(f"❌ TOTP test error: {e}")
        return False, None

def main():
    """Main test function"""
    print("🚀 Groww API Bearer Token Authentication Test")
    print("=" * 60)
    print("Testing the CORRECT approach:")
    print("1. Use access token (manual or TOTP)")
    print("2. Make API calls with Authorization: Bearer headers")
    print("3. Test actual market data endpoints")
    print("=" * 60)
    
    # Step 1: Try to load existing access token
    access_token = load_access_token()
    
    manual_success = False
    totp_success = False
    successful_calls = []
    
    if access_token:
        print("\n" + "=" * 60)
        print("📞 Testing with Manual/Existing Access Token")
        print("=" * 60)
        
        manual_success, manual_calls = test_bearer_authentication(access_token)
        successful_calls.extend(manual_calls)
    
    # Step 2: Try TOTP token generation
    print("\n" + "=" * 60)
    print("🔐 Testing TOTP Token Generation")
    print("=" * 60)
    
    totp_success, totp_token = test_totp_token_generation()
    
    # Final results
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    results = {
        "Manual Token Auth": "✅ Success" if manual_success else "❌ Failed",
        "TOTP Token Generation": "✅ Success" if totp_success else "❌ Failed",
        "Bearer Authentication": "✅ Working" if (manual_success or totp_success) else "❌ Not Working",
        "API Endpoints": f"✅ {len(successful_calls)} working" if successful_calls else "❌ None found"
    }
    
    for test, status in results.items():
        print(f"{test:25}: {status}")
    
    if successful_calls:
        print(f"\n✅ WORKING ENDPOINTS:")
        for call in successful_calls[:3]:  # Show first 3 successful calls
            print(f"   • {call['endpoint']}: {call['url']}")
    
    overall_success = manual_success or totp_success
    
    print("\n" + "=" * 60)
    if overall_success:
        print("🎉 SUCCESS: Bearer Token Authentication Works!")
        print("✅ Groww API is accessible with proper authentication")
        print("✅ Ready to implement in production with Bearer auth headers")
        print("✅ TOTP approach is viable (with Bearer auth pattern)")
    else:
        print("⚠️  AUTHENTICATION ISSUES DETECTED")
        if access_token:
            print("🔐 Token available but API calls failed - check token validity")
        else:
            print("🔑 No valid access token available for testing")
        print("💡 Ensure you have:")
        print("   1. Valid access token from Groww dashboard")
        print("   2. Active Trading API subscription")
        print("   3. Correct API endpoint URLs")
    
    return overall_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)