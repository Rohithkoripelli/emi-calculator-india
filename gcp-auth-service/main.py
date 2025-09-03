"""
Enterprise Groww TOTP Authentication Service - Google Cloud Functions
================================================================

Multi-cloud microservice for TOTP-based authentication using official Groww Python SDK
Designed for integration with Vercel Node.js APIs

Architecture:
- Vercel (Frontend + Data APIs) ←→ Google Cloud Functions (Authentication)
- Official Groww Python SDK with TOTP generation
- RESTful API endpoints for token management
- Enterprise-grade error handling and monitoring
"""

import os
import json
import time
import logging
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure structured logging for Google Cloud
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import dependencies with graceful error handling
try:
    import pyotp
    PYOTP_AVAILABLE = True
    logger.info("✅ pyotp library loaded successfully")
except ImportError as e:
    logger.error(f"❌ pyotp import failed: {e}")
    PYOTP_AVAILABLE = False

try:
    from growwapi import GrowwAPI
    GROWWAPI_AVAILABLE = True
    logger.info("✅ growwapi library loaded successfully")
except ImportError as e:
    logger.error(f"❌ growwapi import failed: {e}")
    GROWWAPI_AVAILABLE = False

# Initialize Flask app for Google Cloud Functions
app = Flask(__name__)
CORS(app, origins=["*"])  # Allow Vercel origins

# Global token cache with enterprise-grade management
class EnterpriseTokenCache:
    def __init__(self):
        self.reset_cache()
        
    def reset_cache(self):
        self.token = None
        self.expiry = 0
        self.generated_at = 0
        self.generation_count = 0
        self.success_count = 0
        self.failure_count = 0
        self.last_error = None
        
    def is_valid(self):
        return self.token and time.time() * 1000 < self.expiry
        
    def cache_token(self, token):
        current_time = time.time() * 1000
        # Groww tokens expire every 11 hours - 5 min safety buffer
        expiry_time = current_time + (11 * 60 * 60 * 1000) - (5 * 60 * 1000)
        
        self.token = token
        self.expiry = expiry_time
        self.generated_at = current_time
        self.generation_count += 1
        self.success_count += 1
        self.failure_count = 0  # Reset on success
        self.last_error = None
        
        logger.info(f"🎟️ Token cached: generation #{self.generation_count}")
        
    def record_failure(self, error_msg):
        self.failure_count += 1
        self.last_error = error_msg
        logger.error(f"❌ Failure #{self.failure_count}: {error_msg}")
        
    def get_metrics(self):
        return {
            'has_token': bool(self.token),
            'is_valid': self.is_valid(),
            'expiry_iso': datetime.fromtimestamp(self.expiry / 1000).isoformat() if self.expiry > 0 else None,
            'generation_count': self.generation_count,
            'success_count': self.success_count,
            'failure_count': self.failure_count,
            'last_error': self.last_error,
            'cache_age_minutes': (time.time() * 1000 - self.generated_at) / 60000 if self.generated_at > 0 else None
        }

# Initialize global cache
token_cache = EnterpriseTokenCache()

class GrowwAuthenticationService:
    """Enterprise TOTP authentication service with comprehensive monitoring"""
    
    @staticmethod
    def validate_environment():
        """Validate environment variables and dependencies"""
        validation_result = {
            'is_valid': False,
            'errors': [],
            'credentials': {}
        }
        
        # Check required environment variables
        api_key = os.getenv('GROWW_API_KEY')
        totp_secret = os.getenv('GROWW_TOTP_SECRET')
        
        if not api_key:
            validation_result['errors'].append('Missing GROWW_API_KEY environment variable')
        else:
            validation_result['credentials']['api_key'] = f"{api_key[:20]}..."
            
        if not totp_secret:
            validation_result['errors'].append('Missing GROWW_TOTP_SECRET environment variable')
        else:
            validation_result['credentials']['totp_secret'] = f"{totp_secret[:15]}..."
            
        # Check dependencies
        if not PYOTP_AVAILABLE:
            validation_result['errors'].append('pyotp library not available')
        if not GROWWAPI_AVAILABLE:
            validation_result['errors'].append('growwapi library not available')
            
        validation_result['is_valid'] = len(validation_result['errors']) == 0
        logger.info(f"🔍 Environment validation: {validation_result['is_valid']}")
        
        return validation_result, api_key, totp_secret
    
    @staticmethod
    def generate_totp_token():
        """Generate new TOTP token using official Groww Python SDK"""
        request_start = time.time()
        
        try:
            # Validate environment
            validation, api_key, totp_secret = GrowwAuthenticationService.validate_environment()
            if not validation['is_valid']:
                error_msg = f"Environment validation failed: {', '.join(validation['errors'])}"
                token_cache.record_failure(error_msg)
                return {
                    'success': False,
                    'error': error_msg,
                    'validation_errors': validation['errors']
                }
            
            logger.info("🔐 Starting TOTP token generation...")
            
            # Generate TOTP using official pyotp
            totp_gen = pyotp.TOTP(totp_secret)
            totp = totp_gen.now()
            logger.info(f"🔐 TOTP generated: {totp}")
            
            # Call official Groww Python SDK
            logger.info("🔄 Calling GrowwAPI.get_access_token()...")
            access_token = GrowwAPI.get_access_token(api_key, totp)
            
            processing_time = time.time() - request_start
            
            if not access_token:
                error_msg = "Groww SDK returned empty token"
                token_cache.record_failure(error_msg)
                return {
                    'success': False,
                    'error': error_msg,
                    'processing_time_seconds': processing_time
                }
            
            # Cache successful token
            token_cache.cache_token(access_token)
            
            logger.info(f"✅ TOTP authentication successful in {processing_time:.2f}s")
            
            return {
                'success': True,
                'token': access_token,
                'source': 'generated',
                'method': 'official_groww_python_sdk',
                'processing_time_seconds': processing_time,
                'totp_used': totp,
                'expires_at': datetime.fromtimestamp(token_cache.expiry / 1000).isoformat()
            }
            
        except Exception as e:
            processing_time = time.time() - request_start
            error_msg = f"TOTP generation failed: {str(e)}"
            logger.error(error_msg)
            token_cache.record_failure(error_msg)
            
            return {
                'success': False,
                'error': error_msg,
                'processing_time_seconds': processing_time,
                'cache_metrics': token_cache.get_metrics()
            }
    
    @staticmethod
    def get_valid_token():
        """Get valid token with intelligent caching"""
        try:
            # Check cached token first
            if token_cache.is_valid():
                cache_age = (time.time() * 1000 - token_cache.generated_at) / 60000
                logger.info(f"✅ Using cached token (age: {cache_age:.1f} minutes)")
                
                return {
                    'success': True,
                    'token': token_cache.token,
                    'source': 'cached',
                    'cache_age_minutes': cache_age,
                    'expires_at': datetime.fromtimestamp(token_cache.expiry / 1000).isoformat()
                }
            
            # Generate new token if cache invalid
            logger.info("🔄 Cache invalid - generating new token...")
            return GrowwAuthenticationService.generate_totp_token()
            
        except Exception as e:
            error_msg = f"Token retrieval failed: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg,
                'cache_metrics': token_cache.get_metrics()
            }

# Google Cloud Functions endpoints
@app.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Health check for monitoring systems"""
    if request.method == 'OPTIONS':
        return '', 200
        
    is_healthy = PYOTP_AVAILABLE and GROWWAPI_AVAILABLE
    
    return jsonify({
        'status': 'healthy' if is_healthy else 'degraded',
        'service': 'groww-totp-auth-service',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'dependencies': {
            'pyotp': PYOTP_AVAILABLE,
            'growwapi': GROWWAPI_AVAILABLE
        },
        'cache_valid': token_cache.is_valid()
    })

@app.route('/token', methods=['GET', 'POST', 'OPTIONS'])
def get_token():
    """Main token endpoint for Vercel integration"""
    if request.method == 'OPTIONS':
        return '', 200
        
    request_id = f"req_{int(time.time() * 1000)}"
    request_start = time.time()
    
    try:
        logger.info(f"📝 [{request_id}] Token request from Vercel")
        
        # Get valid token
        result = GrowwAuthenticationService.get_valid_token()
        
        # Add request metadata
        result.update({
            'request_id': request_id,
            'processing_time_ms': round((time.time() - request_start) * 1000, 2),
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'service': 'gcp-groww-auth',
            'cloud_provider': 'google_cloud_functions'
        })
        
        # Add secure token preview (don't expose full token in logs)
        if result.get('success') and result.get('token'):
            result['token_preview'] = f"{result['token'][:30]}..."
            logger.info(f"✅ [{request_id}] Token provided: {result['source']}")
        else:
            logger.error(f"❌ [{request_id}] Token request failed: {result.get('error')}")
        
        return jsonify(result)
        
    except Exception as e:
        processing_time = round((time.time() - request_start) * 1000, 2)
        error_response = {
            'success': False,
            'error': 'Authentication service error',
            'message': str(e),
            'request_id': request_id,
            'processing_time_ms': processing_time,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'service': 'gcp-groww-auth'
        }
        
        logger.error(f"❌ [{request_id}] Service error: {str(e)}")
        return jsonify(error_response), 500

@app.route('/generate', methods=['POST', 'OPTIONS'])
def force_generate_token():
    """Force generate new token (clears cache)"""
    if request.method == 'OPTIONS':
        return '', 200
        
    request_id = f"gen_{int(time.time() * 1000)}"
    logger.info(f"🔄 [{request_id}] Force token generation requested")
    
    try:
        # Clear cache
        old_generation_count = token_cache.generation_count
        token_cache.reset_cache()
        
        # Generate new token
        result = GrowwAuthenticationService.generate_totp_token()
        
        result.update({
            'action': 'force_generate',
            'request_id': request_id,
            'cache_cleared': True,
            'previous_generation_count': old_generation_count,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        })
        
        return jsonify(result)
        
    except Exception as e:
        error_response = {
            'success': False,
            'error': 'Force generation failed',
            'message': str(e),
            'request_id': request_id,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        return jsonify(error_response), 500

@app.route('/status', methods=['GET', 'OPTIONS'])
def service_status():
    """Comprehensive status check"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        validation, api_key, totp_secret = GrowwAuthenticationService.validate_environment()
        
        return jsonify({
            'success': True,
            'service': 'gcp-groww-auth-service',
            'status': 'operational',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'environment': {
                'has_api_key': bool(api_key),
                'has_totp_secret': bool(totp_secret),
                'validation_errors': validation.get('errors', [])
            },
            'dependencies': {
                'pyotp_available': PYOTP_AVAILABLE,
                'growwapi_available': GROWWAPI_AVAILABLE
            },
            'cache_metrics': token_cache.get_metrics(),
            'capabilities': {
                'can_generate_totp': validation['is_valid'],
                'cache_enabled': True
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Status check failed',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 500

# Google Cloud Functions entry point
def main(request):
    """Main entry point for Google Cloud Functions"""
    with app.app_context():
        return app.full_dispatch_request()

if __name__ == '__main__':
    # Local development
    print("🚀 Groww TOTP Authentication Service - Local Development")
    app.run(host='0.0.0.0', port=8080, debug=True)