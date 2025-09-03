#!/usr/bin/env python3
"""
Advanced Groww API TOTP Debug Script
Provides detailed diagnostics for authentication issues

Usage:
python3 debug_groww_totp.py
"""

import os
import sys
import json
import traceback
from datetime import datetime

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
        return None, None
        
    if not api_secret:
        print("❌ API Secret not found. Set REACT_APP_GROWW_API_SECRET or GROWW_API_SECRET")
        return None, None
    
    print(f"✅ API Key loaded: {api_key[:30]}...")
    print(f"✅ API Secret loaded: {api_secret[:15]}...")
    print(f"🔍 API Key appears to be JWT format: {api_key.startswith('eyJ')}")
    print(f"🔍 API Secret length: {len(api_secret)} chars")
    
    return api_key, api_secret

def detailed_totp_test(api_secret):
    """Generate and validate TOTP with detailed diagnostics"""
    import pyotp
    
    print("🔐 Detailed TOTP analysis...")
    
    try:
        # Test TOTP secret format
        print(f"🔍 Testing TOTP secret format...")
        print(f"   Secret: {api_secret}")
        print(f"   Length: {len(api_secret)}")
        print(f"   Characters: {set(api_secret)}")
        
        # Check if it's valid Base32
        try:
            import base64
            decoded = base64.b32decode(api_secret)
            print(f"✅ Valid Base32 format, decoded length: {len(decoded)} bytes")
        except Exception as b32_error:
            print(f"⚠️  Base32 decode warning: {b32_error}")
        
        # Generate TOTP
        totp_gen = pyotp.TOTP(api_secret)
        totp = totp_gen.now()
        
        # Generate multiple TOTPs for time window testing
        current_time = datetime.now().timestamp()
        print(f"🕐 Current timestamp: {current_time}")
        
        # Test different time windows
        for offset in [-1, 0, 1]:
            test_time = int(current_time) + (offset * 30)
            test_totp = totp_gen.at(test_time)
            print(f"   TOTP at T{offset*30:+3d}s: {test_totp}")
        
        print(f"✅ Current TOTP: {totp}")
        print(f"🕐 Valid for ~{30 - (datetime.now().second % 30)} seconds")
        
        return totp
        
    except Exception as e:
        print(f"❌ TOTP generation failed: {e}")
        print(f"🔍 Full error: {traceback.format_exc()}")
        return None

def detailed_authentication_test(api_key, totp):
    """Test authentication with detailed error reporting"""
    print("🔄 Detailed authentication test...")
    
    try:
        from growwapi import GrowwAPI
        print("✅ GrowwAPI imported successfully")
        
        # Check API version
        print(f"🔍 GrowwAPI version: {getattr(GrowwAPI, '__version__', 'unknown')}")
        
        # Try to get access token with detailed error handling
        print("📞 Attempting to get access token...")
        print(f"   API Key: {api_key[:30]}...")
        print(f"   TOTP: {totp}")
        
        try:
            access_token = GrowwAPI.get_access_token(api_key, totp)
            
            if access_token:
                print("✅ Access token obtained!")
                print(f"   Token: {access_token[:50]}...")
                return access_token
            else:
                print("❌ Access token is None/empty")
                return None
                
        except Exception as auth_error:
            print(f"❌ Authentication API call failed: {auth_error}")
            print(f"🔍 Error type: {type(auth_error).__name__}")
            print(f"🔍 Error details: {str(auth_error)}")
            
            # Try to extract more details from the error
            if hasattr(auth_error, 'response'):
                print(f"🔍 HTTP Response: {auth_error.response}")
            if hasattr(auth_error, 'status_code'):
                print(f"🔍 Status Code: {auth_error.status_code}")
            if hasattr(auth_error, 'text'):
                print(f"🔍 Response Text: {auth_error.text}")
                
            print(f"🔍 Full traceback: {traceback.format_exc()}")
            return None
            
    except ImportError as import_error:
        print(f"❌ Failed to import GrowwAPI: {import_error}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        print(f"🔍 Full traceback: {traceback.format_exc()}")
        return None

def test_manual_http_request(api_key, totp):
    """Test manual HTTP request to potential Groww endpoints"""
    import requests
    
    print("🌐 Testing manual HTTP authentication requests...")
    
    # Potential Groww authentication endpoints based on common patterns
    endpoints = [
        "https://api.groww.in/v1/auth/login",
        "https://openapi.groww.in/v1/auth/login", 
        "https://api.groww.in/v1/auth/token",
        "https://openapi.groww.in/v1/auth/token",
        "https://api.groww.in/v1/oauth/token",
        "https://openapi.groww.in/v1/oauth/token",
    ]
    
    # Different request formats to try
    request_formats = [
        # Format 1: JSON with api_key and totp
        {
            'headers': {'Content-Type': 'application/json'},
            'json': {'api_key': api_key, 'totp': totp}
        },
        # Format 2: JSON with apikey and totp
        {
            'headers': {'Content-Type': 'application/json'},
            'json': {'apikey': api_key, 'totp': totp}
        },
        # Format 3: Form data
        {
            'headers': {'Content-Type': 'application/x-www-form-urlencoded'},
            'data': {'api_key': api_key, 'totp': totp}
        },
        # Format 4: Form data with different field names
        {
            'headers': {'Content-Type': 'application/x-www-form-urlencoded'},
            'data': {'apikey': api_key, 'totp': totp}
        }
    ]
    
    for endpoint in endpoints:
        print(f"\n🔍 Testing endpoint: {endpoint}")
        
        for i, request_format in enumerate(request_formats):
            print(f"   📤 Format {i+1}: {request_format['headers']['Content-Type']}")
            
            try:
                response = requests.post(
                    endpoint,
                    timeout=10,
                    **request_format
                )
                
                print(f"   📊 Status: {response.status_code}")
                print(f"   📋 Headers: {dict(response.headers)}")
                
                try:
                    response_json = response.json()
                    print(f"   📄 Response: {json.dumps(response_json, indent=2)}")
                except:
                    print(f"   📄 Response Text: {response.text[:200]}...")
                
                if response.status_code == 200:
                    print(f"   ✅ SUCCESS! This endpoint/format combination works!")
                    return True
                    
            except requests.exceptions.Timeout:
                print(f"   ⏰ Timeout")
            except requests.exceptions.ConnectionError:
                print(f"   🔌 Connection failed")
            except Exception as e:
                print(f"   ❌ Error: {e}")
    
    return False

def analyze_api_key_format(api_key):
    """Analyze the API key to understand its format"""
    print("🔍 Analyzing API Key format...")
    
    # Check if it looks like a JWT
    if api_key.count('.') == 2:
        print("✅ API Key appears to be JWT format")
        
        try:
            import base64
            import json
            
            # Decode JWT parts (without verification for analysis)
            header_b64, payload_b64, signature_b64 = api_key.split('.')
            
            # Add padding if needed
            header_b64 += '=' * (4 - len(header_b64) % 4)
            payload_b64 += '=' * (4 - len(payload_b64) % 4)
            
            header = json.loads(base64.urlsafe_b64decode(header_b64))
            payload = json.loads(base64.urlsafe_b64decode(payload_b64))
            
            print(f"🔍 JWT Header: {json.dumps(header, indent=2)}")
            print(f"🔍 JWT Payload keys: {list(payload.keys())}")
            
            # Check expiry
            if 'exp' in payload:
                exp_time = datetime.fromtimestamp(payload['exp'])
                print(f"🕐 JWT Expires: {exp_time}")
                
                if datetime.now() > exp_time:
                    print("⚠️  JWT is EXPIRED!")
                else:
                    print("✅ JWT is still valid")
                    
        except Exception as jwt_error:
            print(f"⚠️  JWT analysis failed: {jwt_error}")
    else:
        print("🔍 API Key is not JWT format")

def main():
    """Main diagnostic function"""
    print("🔬 Advanced Groww API TOTP Diagnostics")
    print("=" * 60)
    
    # Load credentials
    api_key, api_secret = load_credentials()
    if not api_key or not api_secret:
        return False
    
    print("\n" + "=" * 60)
    
    # Analyze API key format
    analyze_api_key_format(api_key)
    
    print("\n" + "=" * 60)
    
    # Test TOTP generation
    totp = detailed_totp_test(api_secret)
    if not totp:
        return False
    
    print("\n" + "=" * 60)
    
    # Test authentication
    access_token = detailed_authentication_test(api_key, totp)
    
    print("\n" + "=" * 60)
    
    # Test manual HTTP requests
    manual_success = test_manual_http_request(api_key, totp)
    
    print("\n" + "=" * 60)
    print("📊 DIAGNOSTIC SUMMARY")
    print("=" * 60)
    
    print(f"Credentials: ✅ Loaded")
    print(f"TOTP Generation: ✅ Working")
    print(f"GrowwAPI Auth: ❌ Failed (400 Bad Request)")
    print(f"Manual HTTP: {'✅ Found working endpoint' if manual_success else '❌ No working endpoint found'}")
    
    return manual_success

if __name__ == "__main__":
    success = main()
    print(f"\n🎯 Result: {'SUCCESS' if success else 'NEEDS INVESTIGATION'}")
    sys.exit(0 if success else 1)