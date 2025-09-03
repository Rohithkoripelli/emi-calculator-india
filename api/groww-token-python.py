#!/usr/bin/env python3
"""
Groww Token Generation API - Pure Python Implementation
Uses official Groww Python SDK with TOTP authentication
Vercel serverless function with Python runtime
"""

import os
import json
import time
import pyotp
from growwapi import GrowwAPI
from http.server import BaseHTTPRequestHandler

# Token cache with expiry (in-memory for this function)
token_cache = {
    'token': None,
    'expiry': 0
}

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return

    def do_GET(self):
        """Handle GET requests"""
        self.handle_request()

    def do_POST(self):
        """Handle POST requests"""
        self.handle_request()

    def handle_request(self):
        """Main request handler"""
        try:
            # Set CORS headers
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()

            # Parse request
            if self.command == 'GET':
                from urllib.parse import urlparse, parse_qs
                parsed_url = urlparse(self.path)
                query_params = parse_qs(parsed_url.query)
                action = query_params.get('action', ['get'])[0]
            else:
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    post_data = self.rfile.read(content_length).decode('utf-8')
                    data = json.loads(post_data)
                    action = data.get('action', 'get')
                else:
                    action = 'get'

            # Handle different actions
            if action == 'generate':
                result = self.generate_new_token()
            elif action == 'status':
                result = self.get_token_status()
            else:  # action == 'get'
                result = self.get_valid_token()

            # Send response
            response = json.dumps(result)
            self.wfile.write(response.encode('utf-8'))

        except Exception as e:
            print(f"❌ Python Token API Error: {str(e)}")
            error_response = {
                'success': False,
                'error': 'Token service failed',
                'message': str(e)
            }
            response = json.dumps(error_response)
            self.wfile.write(response.encode('utf-8'))

    def generate_access_token(self):
        """Generate access token using official Groww Python SDK"""
        global token_cache
        
        # Get credentials from environment
        api_key = (os.getenv('REACT_APP_GROWW_API_KEY') or 
                  os.getenv('GROWW_API_KEY'))
        totp_secret = (os.getenv('REACT_APP_GROWW_API_SECRET') or 
                      os.getenv('REACT_APP_GROWW_TOTP_SECRET') or 
                      os.getenv('GROWW_API_SECRET'))

        if not api_key or not totp_secret:
            raise Exception('Missing GROWW_API_KEY or GROWW_TOTP_SECRET environment variables')

        print(f'🔐 Generating access token using official Groww Python SDK...')
        print(f'🔧 API Key: {api_key[:30]}...')
        print(f'🔧 TOTP Secret: {totp_secret[:15]}...')

        # Generate TOTP using official pyotp library
        totp_gen = pyotp.TOTP(totp_secret)
        totp = totp_gen.now()
        print(f'🔐 Generated TOTP: {totp}')

        # Use official Groww SDK method
        print('🔄 Calling official GrowwAPI.get_access_token()...')
        access_token = GrowwAPI.get_access_token(api_key, totp)

        if not access_token:
            raise Exception('No access token returned from official Groww SDK')

        print(f'✅ Official Groww SDK authentication successful!')
        print(f'🎟️ Token: {access_token[:50]}...')

        # Cache the token with 11-hour expiry
        expires_in_ms = 11 * 60 * 60 * 1000  # 11 hours
        token_cache = {
            'token': access_token,
            'expiry': time.time() * 1000 + expires_in_ms - (5 * 60 * 1000)  # 5 min buffer
        }

        return access_token

    def get_valid_token(self):
        """Get valid access token (manual, cached, or generate new)"""
        global token_cache
        
        # PRIORITY 1: Check for manual token first
        manual_token = (os.getenv('REACT_APP_GROWW_ACCESS_TOKEN') or 
                       os.getenv('GROWW_ACCESS_TOKEN'))
        if manual_token:
            print('✅ Using manual access token (bypassing Python SDK)')
            return {
                'success': True,
                'hasToken': True,
                'tokenPreview': f'{manual_token[:50]}...',
                'source': 'manual'
            }

        # PRIORITY 2: Check cached automated token
        if token_cache['token'] and time.time() * 1000 < token_cache['expiry']:
            print('✅ Using cached automated token')
            return {
                'success': True,
                'hasToken': True,
                'tokenPreview': f'{token_cache["token"][:50]}...',
                'source': 'cached'
            }

        # PRIORITY 3: Generate new token via Python SDK
        print('🔄 Attempting automated token generation via Python SDK...')
        try:
            token = self.generate_access_token()
            return {
                'success': True,
                'hasToken': True,
                'tokenPreview': f'{token[:50]}...',
                'source': 'generated'
            }
        except Exception as e:
            print(f'❌ Python SDK token generation failed: {str(e)}')
            raise Exception(f'Python SDK failed: {str(e)}. Set manual token as fallback.')

    def generate_new_token(self):
        """Force generate new token"""
        global token_cache
        # Clear cache
        token_cache = {'token': None, 'expiry': 0}
        token = self.generate_access_token()
        return {
            'success': True,
            'message': 'Token generated successfully',
            'hasToken': bool(token),
            'tokenPreview': f'{token[:50]}...' if token else None
        }

    def get_token_status(self):
        """Check token status"""
        has_manual_token = bool(os.getenv('REACT_APP_GROWW_ACCESS_TOKEN') or 
                               os.getenv('GROWW_ACCESS_TOKEN'))
        has_cached_token = bool(token_cache['token'] and 
                               time.time() * 1000 < token_cache['expiry'])
        has_credentials = bool((os.getenv('REACT_APP_GROWW_API_KEY') or 
                               os.getenv('GROWW_API_KEY')) and
                              (os.getenv('REACT_APP_GROWW_TOTP_SECRET') or 
                               os.getenv('GROWW_TOTP_SECRET')))

        return {
            'success': True,
            'tokenStatus': {
                'hasManualToken': has_manual_token,
                'hasCachedToken': has_cached_token,
                'hasCredentials': has_credentials,
                'cacheExpiry': time.strftime('%Y-%m-%dT%H:%M:%S.%fZ', 
                              time.gmtime(token_cache['expiry'] / 1000)) if token_cache['expiry'] > 0 else None,
                'canGenerate': has_credentials
            }
        }