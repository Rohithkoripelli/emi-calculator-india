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
            
            # According to Groww documentation
            # Use GrowwAPI.get_access_token(api_key, totp)
            # But we need to make HTTP request directly
            
            # The actual endpoint might be different, this is based on typical OAuth2 patterns
            token_url = "https://openapi.groww.in/v1/auth/token"
            
            payload = {
                "api_key": self.api_key,
                "totp": totp_code,
                "grant_type": "client_credentials"
            }
            
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "GrowwAuthService/1.0"
            }
            
            response = requests.post(token_url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                token_data = response.json()
                
                # Extract access token
                if 'access_token' in token_data:
                    self.access_token = token_data['access_token']
                    
                    # Calculate expiry (default to 12 hours if not provided)
                    expires_in = token_data.get('expires_in', 43200)  # 12 hours default
                    self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
                    
                    logger.info(f"✅ Access token obtained successfully. Expires at: {self.token_expires_at}")
                    return self.access_token
                else:
                    logger.error(f"❌ No access token in response: {token_data}")
                    raise ValueError("Access token not found in response")
                    
            else:
                logger.error(f"❌ Token request failed: {response.status_code} - {response.text}")
                raise ValueError(f"Token request failed: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Network error fetching access token: {e}")
            raise
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

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    logger.info("🏥 Health check endpoint accessed")
    return jsonify({
        "service": "Groww Authentication Service",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "railway_deployment": True
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
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
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