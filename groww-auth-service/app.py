#!/usr/bin/env python3
"""
Groww Authentication Service for Railway Deployment
A Python Flask service that handles Groww API authentication using API Key + TOTP
"""

import os
import logging
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import pyotp
import requests
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

# Configure Flask for production
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
app.config['JSON_SORT_KEYS'] = False

class GrowwAuthManager:
    def __init__(self):
        self.api_key = os.getenv('GROWW_API_KEY')
        self.api_secret = os.getenv('GROWW_API_SECRET')  # This is the TOTP secret
        self.access_token = None
        self.token_expires_at = None
        
        if not self.api_key or not self.api_secret:
            logger.warning("⚠️  Missing Groww API credentials. Set GROWW_API_KEY and GROWW_API_SECRET environment variables.")
        else:
            logger.info("✅ Groww API credentials loaded successfully")
    
    def generate_totp(self):
        """Generate TOTP code using the API secret"""
        try:
            if not self.api_secret:
                raise ValueError("TOTP secret not configured")
            
            totp_gen = pyotp.TOTP(self.api_secret)
            totp_code = totp_gen.now()
            
            logger.info(f"🔐 Generated TOTP: {totp_code}")
            return totp_code
        except Exception as e:
            logger.error(f"❌ Error generating TOTP: {e}")
            raise
    
    def fetch_access_token(self):
        """Fetch access token from Groww API using API key and TOTP"""
        try:
            logger.info("🔄 Fetching access token from Groww API...")
            
            # Generate TOTP
            totp_code = self.generate_totp()
            
            # Try direct API calls with different possible endpoints
            # Based on research: Groww may not have a public HTTP auth endpoint
            # They expect users to either use manual tokens or their Python SDK
            endpoints_to_try = [
                "https://api.groww.in/v1/auth/token",
                "https://api.groww.in/v1/user/auth",
                "https://api.groww.in/auth/login",
                "https://api.groww.in/v1/login", 
                "https://groww.in/api/v1/auth/token",
                "https://groww.in/api/auth/login"
            ]
            
            # Try different payload formats that Groww might expect
            payloads_to_try = [
                {
                    "api_key": self.api_key,
                    "totp": totp_code,
                    "grant_type": "client_credentials"
                },
                {
                    "apikey": self.api_key,
                    "totp": totp_code
                },
                {
                    "key": self.api_key,
                    "secret": totp_code
                },
                {
                    "username": self.api_key,
                    "password": totp_code
                }
            ]
            
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "GrowwAuthService/1.0",
                "Accept": "application/json"
            }
            
            # Try all combinations of endpoints and payload formats
            for token_url in endpoints_to_try:
                for i, payload in enumerate(payloads_to_try):
                    try:
                        logger.info(f"🔄 Trying endpoint: {token_url} with payload format {i+1}")
                        response = requests.post(token_url, json=payload, headers=headers, timeout=30)
                        
                        logger.info(f"📊 Response status: {response.status_code}")
                        
                        if response.status_code == 200:
                            try:
                                token_data = response.json()
                                
                                # Try different possible token field names
                                token_fields = ['access_token', 'token', 'auth_token', 'apiToken', 'accessToken']
                                access_token = None
                                
                                for field in token_fields:
                                    if field in token_data:
                                        access_token = token_data[field]
                                        break
                                
                                if access_token:
                                    self.access_token = access_token
                                    
                                    # Calculate expiry (default to 11 hours)
                                    expires_in = token_data.get('expires_in', 39600)  # 11 hours default
                                    self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
                                    
                                    logger.info(f"✅ Access token obtained from {token_url} with payload format {i+1}")
                                    logger.info(f"🎉 Token field found: '{field}' with value: {access_token[:20]}...")
                                    return self.access_token
                                else:
                                    logger.warning(f"⚠️ No token field found in response from {token_url}: {token_data}")
                                    
                            except ValueError as json_error:
                                logger.warning(f"⚠️ Invalid JSON from {token_url}: {response.text[:200]}")
                                
                        elif response.status_code in [401, 403]:
                            logger.warning(f"⚠️ Authentication failed ({response.status_code}) for {token_url}: {response.text[:200]}")
                        else:
                            logger.warning(f"⚠️ HTTP {response.status_code} from {token_url}: {response.text[:200]}")
                            
                    except requests.exceptions.RequestException as e:
                        logger.warning(f"⚠️ Network error with {token_url}: {e}")
                        continue
            
            # If we get here, all endpoints failed
            # IMPORTANT: Groww may not provide direct HTTP authentication endpoints
            # They expect users to either use manual tokens or their Python SDK
            
            logger.error("🚨 All authentication endpoints failed!")
            logger.error("💡 SOLUTION OPTIONS:")
            logger.error("   1. Groww may not support direct HTTP TOTP authentication")  
            logger.error("   2. Generate manual token from: https://groww.in/user/profile/trading-apis")
            logger.error("   3. Set GROWW_ACCESS_TOKEN environment variable with manual token")
            logger.error("   4. Use Groww's official Python SDK in a different service")
            
            # Check if user provided a manual access token as fallback
            manual_token = os.getenv('GROWW_ACCESS_TOKEN')
            if manual_token:
                logger.info("🔄 Found manual GROWW_ACCESS_TOKEN, using as fallback...")
                self.access_token = manual_token
                # Manual tokens expire at 6 AM, set expiry accordingly
                tomorrow_6am = datetime.now().replace(hour=6, minute=0, second=0, microsecond=0)
                if tomorrow_6am <= datetime.now():
                    tomorrow_6am += timedelta(days=1)
                self.token_expires_at = tomorrow_6am
                
                logger.info(f"✅ Using manual access token. Expires at: {self.token_expires_at}")
                return self.access_token
            
            raise ValueError("All Groww authentication methods failed. Consider using manual token generation from Groww's website.")
                
        except Exception as e:
            logger.error(f"❌ Error fetching access token: {e}")
            raise
    
    def get_access_token(self):
        """Get valid access token, refreshing if needed"""
        try:
            # Check if we have a valid token
            if self.access_token and self.token_expires_at:
                # Add 5 minute buffer before expiry
                if datetime.now() < (self.token_expires_at - timedelta(minutes=5)):
                    logger.info("✅ Using existing valid token")
                    return self.access_token
            
            # Token expired or doesn't exist, get a new one
            logger.info("🔄 Token expired or missing, fetching new token...")
            return self.fetch_access_token()
            
        except Exception as e:
            logger.error(f"❌ Failed to get access token: {e}")
            raise
    
    def is_configured(self):
        """Check if API credentials are configured"""
        return bool(self.api_key and self.api_secret)
    
    def get_status(self):
        """Get authentication service status"""
        return {
            "configured": self.is_configured(),
            "has_token": bool(self.access_token),
            "token_expires_at": self.token_expires_at.isoformat() if self.token_expires_at else None,
            "is_token_valid": bool(self.access_token and self.token_expires_at and 
                                 datetime.now() < (self.token_expires_at - timedelta(minutes=5)))
        }

# Initialize the auth manager
auth_manager = GrowwAuthManager()

# Add request logging middleware
@app.before_request
def log_request_info():
    logger.info(f"🌐 Request: {request.method} {request.path} from {request.remote_addr}")
    logger.info(f"📝 Headers: {dict(request.headers)}")

@app.after_request
def log_response_info(response):
    logger.info(f"📤 Response: {response.status_code} for {request.method} {request.path}")
    return response

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    logger.info("🏥 Health check endpoint accessed")
    return jsonify({
        "service": "Groww Authentication Service",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "railway_deployment": True,
        "uptime_seconds": time.time() - start_time if 'start_time' in globals() else 0
    }), 200

@app.route('/health', methods=['GET'])
def health():
    """Alternative health check endpoint"""
    return jsonify({"status": "healthy"}), 200

@app.route('/debug', methods=['GET'])
def debug_routes():
    """Debug endpoint to list all routes"""
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            "endpoint": rule.endpoint,
            "methods": list(rule.methods),
            "rule": rule.rule
        })
    return jsonify({
        "success": True,
        "routes": routes,
        "flask_version": "2.3.3",
        "debug": True
    })

@app.route('/auth/token', methods=['POST'])
def get_token():
    """Get access token endpoint"""
    try:
        if not auth_manager.is_configured():
            return jsonify({
                "success": False,
                "error": "Authentication service not configured. Please set GROWW_API_KEY and GROWW_API_SECRET environment variables."
            }), 500
        
        # Get access token
        access_token = auth_manager.get_access_token()
        
        return jsonify({
            "success": True,
            "access_token": access_token,
            "expires_at": auth_manager.token_expires_at.isoformat() if auth_manager.token_expires_at else None,
            "message": "Access token generated successfully"
        })
        
    except Exception as e:
        logger.error(f"❌ Error in /auth/token: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/auth/status', methods=['GET'])
def get_status():
    """Get authentication service status"""
    try:
        status = auth_manager.get_status()
        
        return jsonify({
            "success": True,
            "status": status,
            "service_info": {
                "name": "Groww Authentication Service",
                "version": "1.0.0",
                "uptime": time.time() - start_time if 'start_time' in globals() else 0
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error in /auth/status: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/auth/test', methods=['POST'])
def test_auth():
    """Test authentication flow"""
    try:
        if not auth_manager.is_configured():
            return jsonify({
                "success": False,
                "error": "Authentication service not configured",
                "configured": False
            })
        
        # Test TOTP generation
        totp_code = auth_manager.generate_totp()
        
        # Test token fetching
        access_token = auth_manager.get_access_token()
        
        return jsonify({
            "success": True,
            "message": "Authentication test successful",
            "totp_generated": True,
            "token_obtained": bool(access_token),
            "configured": True
        })
        
    except Exception as e:
        logger.error(f"❌ Error in /auth/test: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "configured": auth_manager.is_configured()
        }), 500

@app.errorhandler(404)
def not_found(error):
    logger.error(f"❌ 404 Error: {request.method} {request.path} not found")
    logger.error(f"Available routes: {[rule.rule for rule in app.url_map.iter_rules()]}")
    return jsonify({
        "success": False,
        "error": f"Endpoint not found: {request.method} {request.path}",
        "available_endpoints": [rule.rule for rule in app.url_map.iter_rules() if not rule.rule.startswith('/static')]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500

if __name__ == '__main__':
    start_time = time.time()
    
    # Print configuration status
    if auth_manager.is_configured():
        logger.info("🚀 Groww Authentication Service starting with full configuration")
    else:
        logger.warning("⚠️  Starting with incomplete configuration - set environment variables")
    
    # Get port from environment (Railway provides this)
    port = int(os.getenv('PORT', 8080))
    
    logger.info(f"🌐 Starting server on port {port}")
    logger.info(f"🔧 Flask app routes: {[rule.rule for rule in app.url_map.iter_rules()]}")
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
else:
    # When running with gunicorn
    start_time = time.time()
    logger.info("🚀 Groww Authentication Service started with gunicorn")
    logger.info(f"🔧 Available routes: {[rule.rule for rule in app.url_map.iter_rules()]}")
    if auth_manager.is_configured():
        logger.info("✅ Service fully configured and ready")
    else:
        logger.warning("⚠️  Service running with incomplete configuration")