#!/usr/bin/env python3
"""
Groww Authentication Service for Railway Deployment
A Python Flask service that handles Groww API authentication using API Key + TOTP
"""

import os
import logging
import time
import threading
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
        """Fetch access token from Groww API using API key and TOTP - exactly like user's working code"""
        try:
            logger.info("🔄 Fetching access token using Groww SDK (like your working local code)...")
            
            # Generate TOTP - exactly like your code
            totp_gen = pyotp.TOTP(self.api_secret)
            totp = totp_gen.now()
            logger.info(f"🔐 Generated TOTP: {totp}")
            
            # Use GrowwAPI.get_access_token - exactly like your code
            from growwapi import GrowwAPI
            logger.info("🐍 Calling GrowwAPI.get_access_token...")
            
            access_token = GrowwAPI.get_access_token(self.api_key, totp)
            
            if access_token:
                self.access_token = access_token
                # Set expiry to 11 hours (before 6 AM reset)
                self.token_expires_at = datetime.now() + timedelta(hours=11)
                
                logger.info(f"✅ Access token obtained successfully!")
                logger.info(f"🎉 Token: {access_token[:20]}...")
                logger.info(f"⏰ Expires at: {self.token_expires_at}")
                
                return self.access_token
            else:
                raise ValueError("GrowwAPI.get_access_token returned None")
                
        except ImportError as e:
            logger.error(f"❌ growwapi import failed: {e}")
            raise ValueError("growwapi package not available - check requirements.txt")
        except Exception as e:
            logger.error(f"❌ Error with GrowwAPI.get_access_token: {e}")
            
            # Fallback to manual token if provided
            manual_token = os.getenv('GROWW_ACCESS_TOKEN')
            if manual_token:
                logger.info("🔄 Using manual GROWW_ACCESS_TOKEN as fallback...")
                self.access_token = manual_token
                tomorrow_6am = datetime.now().replace(hour=6, minute=0, second=0, microsecond=0)
                if tomorrow_6am <= datetime.now():
                    tomorrow_6am += timedelta(days=1)
                self.token_expires_at = tomorrow_6am
                
                logger.info(f"✅ Using manual access token. Expires at: {self.token_expires_at}")
                return self.access_token
            
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
        "version": "1.2.1",
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

@app.route('/api/quote/<symbol>', methods=['GET'])
def get_quote(symbol):
    """Get real-time quote from Groww API - acts as CORS-free proxy"""
    try:
        if not auth_manager.is_configured():
            return jsonify({
                "success": False,
                "error": "Authentication service not configured"
            }), 500
        
        # Get access token
        access_token = auth_manager.get_access_token()
        
        # Default parameters
        exchange = request.args.get('exchange', 'NSE')
        segment = request.args.get('segment', 'CASH')
        
        # Try alternative Groww API endpoints (multiple fallbacks)
        endpoints_to_try = [
            # Pattern 1: Live data quote endpoint
            f"https://api.groww.in/v1/live-data/quote?exchange={exchange}&segment={segment}&trading_symbol={symbol}",
            # Pattern 2: OHLC endpoint
            f"https://api.groww.in/v1/live-data/ohlc?segment={segment}&exchange_symbols={exchange}_{symbol}",
            # Pattern 3: LTP endpoint  
            f"https://api.groww.in/v1/live-data/ltp?segment={segment}&exchange_symbols={exchange}_{symbol}",
            # Pattern 4: Original accord points endpoint
            f"https://api.groww.in/v1/api/stocks_data/v1/accord_points/exchange/{exchange}/segment/{segment}/latest_prices_ohlc/{symbol}"
        ]
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-VERSION': '1.0',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        logger.info(f"🔄 Proxying quote request for {symbol} to Groww API...")
        
        # Try each endpoint until one works
        for i, groww_url in enumerate(endpoints_to_try, 1):
            try:
                logger.info(f"📡 Trying endpoint {i}/{len(endpoints_to_try)}: {groww_url}")
                response = requests.get(groww_url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✅ Successfully fetched quote for {symbol} using endpoint {i}")
                    logger.info(f"🎯 Working endpoint: {groww_url}")
                    return jsonify({
                        "success": True,
                        "data": data,
                        "proxied_from": "groww_api",
                        "endpoint_used": i,
                        "endpoint_url": groww_url
                    })
                else:
                    logger.warning(f"⚠️ Endpoint {i} failed: {response.status_code} - {response.text[:100]}")
                    
            except Exception as e:
                logger.warning(f"⚠️ Endpoint {i} exception: {e}")
                continue
        
        # All endpoints failed
        logger.error(f"❌ All Groww API endpoints failed for {symbol}")
        return jsonify({
            "success": False,
            "error": "All Groww API endpoints failed",
            "endpoints_tried": len(endpoints_to_try)
        }), 500
            
    except Exception as e:
        logger.error(f"❌ Error in /api/quote/{symbol}: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/historical/<symbol>', methods=['GET'])
def get_historical(symbol):
    """Get historical data from Groww API - acts as CORS-free proxy"""
    try:
        if not auth_manager.is_configured():
            return jsonify({
                "success": False,
                "error": "Authentication service not configured"
            }), 500
        
        # Get access token
        access_token = auth_manager.get_access_token()
        
        # Parameters
        exchange = request.args.get('exchange', 'NSE')
        segment = request.args.get('segment', 'CASH')
        days = int(request.args.get('days', 30))
        
        # Calculate date range
        from datetime import datetime, timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Format dates for Groww historical API (exactly as provided in working example)
        # Market hours: 09:15:00 to 15:30:00 for intraday, but for daily candles we can use 09:15:00 to 15:15:00
        formatted_start_datetime = start_date.strftime('%Y-%m-%d 09:15:00')
        formatted_end_datetime = end_date.strftime('%Y-%m-%d 15:15:00')
        
        # Use the EXACT working endpoint format provided by user
        historical_url = "https://api.groww.in/v1/historical/candle/range"
        
        # Prepare parameters with proper interval limits (max 10080 minutes = 1 week)
        # Choose interval based on the period to stay within Groww's limits
        if days <= 2:
            interval_minutes = 60    # 1-hour candles for very short periods
        elif days <= 7:
            interval_minutes = 240   # 4-hour candles for week periods
        elif days <= 30:
            interval_minutes = 1440  # Daily candles for monthly periods
        else:
            interval_minutes = 1440  # Daily candles for longer periods (max allowed)
        
        params = {
            'exchange': exchange,
            'segment': segment, 
            'trading_symbol': symbol,
            'start_time': formatted_start_datetime,  # Will be URL encoded by requests
            'end_time': formatted_end_datetime,      # Will be URL encoded by requests
            'interval_in_minutes': interval_minutes
        }
        
        logger.info(f"📊 Using interval: {interval_minutes} minutes for {days}-day period")
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-VERSION': '1.0',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        logger.info(f"🔄 Proxying historical request for {symbol} ({days} days) to Groww API...")
        logger.info(f"📡 Using working historical endpoint: {historical_url}")
        logger.info(f"📊 Parameters: {params}")
        
        try:
            response = requests.get(historical_url, headers=headers, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate the response has the expected Groww format
                if data.get('status') == 'SUCCESS' and data.get('payload') and data.get('payload', {}).get('candles'):
                    candles_count = len(data['payload']['candles'])
                    logger.info(f"✅ Successfully fetched {candles_count} historical candles for {symbol}")
                    logger.info(f"🎯 Using confirmed working endpoint: {historical_url}")
                    
                    return jsonify({
                        "success": True,
                        "data": data,
                        "proxied_from": "groww_api",
                        "endpoint_url": historical_url,
                        "candles_count": candles_count,
                        "params": {
                            "symbol": symbol,
                            "days": days,
                            "start_time": formatted_start_datetime,
                            "end_time": formatted_end_datetime,
                            "interval_in_minutes": params['interval_in_minutes']
                        }
                    })
                else:
                    logger.warning(f"⚠️ Historical API returned unexpected format: {data}")
                    return jsonify({
                        "success": False,
                        "error": "Historical API returned unexpected format",
                        "response_data": data
                    }), 500
                    
            else:
                logger.error(f"❌ Groww historical API error for {symbol}: {response.status_code} - {response.text}")
                return jsonify({
                    "success": False,
                    "error": f"Groww historical API error: {response.status_code}",
                    "details": response.text
                }), response.status_code
                
        except Exception as e:
            logger.error(f"❌ Exception in historical API for {symbol}: {e}")
            return jsonify({
                "success": False,
                "error": f"Historical API exception: {str(e)}"
            }), 500
            
    except Exception as e:
        logger.error(f"❌ Error in /api/historical/{symbol}: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/place-order', methods=['POST', 'OPTIONS'])
def place_order():
    """Place a buy/sell order via Groww API"""

    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        logger.info("📤 Response: 200 for OPTIONS /api/place-order")
        return response, 200

    logger.info(f"🛒 Received order placement request...")

    try:
        # Get order parameters from request body
        order_params = request.get_json()
        logger.info(f"📝 Order parameters: {order_params}")

        # Check if paper trading mode is enabled
        paper_trading_mode = os.getenv('PAPER_TRADING_MODE', 'false').lower() == 'true'

        logger.info(f"🎯 Trading mode: {'PAPER TRADING' if paper_trading_mode else 'LIVE TRADING'}")

        # PAPER TRADING MODE - Simulates order without calling Groww
        if paper_trading_mode:
            import time
            paper_order_response = {
                "status": "SUCCESS",
                "payload": {
                    "groww_order_id": f"PAPER-{int(time.time() * 1000)}",
                    "order_status": "PAPER_TRADE_SIMULATED",
                    "order_reference_id": order_params.get('order_reference_id', ''),
                    "remark": "⚠️ This is a PAPER TRADING simulation. No real order was placed."
                },
                "paper_trading": True
            }
            logger.info(f"📝 Paper trading order simulated: {paper_order_response['payload']['groww_order_id']}")

            response = jsonify(paper_order_response)
            response.headers.add('Access-Control-Allow-Origin', '*')
            logger.info(f"📤 Response: 200 for POST /api/place-order (PAPER TRADING)")
            return response, 200

        # LIVE TRADING MODE - Actually calls Groww API
        logger.info("🔥 LIVE TRADING MODE - Placing real order via Groww API...")

        # Get authentication token
        token = auth_manager.get_access_token()
        if not token:
            logger.error("❌ No authentication token available")
            return jsonify({
                "status": "FAILED",
                "error": "Authentication token not available. Please configure Groww credentials."
            }), 401

        # Prepare Groww API request
        import requests
        groww_url = "https://api.groww.in/v1/order/create"

        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'X-API-VERSION': '1.0',
            'User-Agent': 'Mozilla/5.0'
        }

        # Map order parameters to Groww format
        groww_order_payload = {
            "trading_symbol": order_params.get('trading_symbol'),
            "quantity": order_params.get('quantity'),
            "price": order_params.get('price'),
            "trigger_price": order_params.get('trigger_price'),
            "validity": order_params.get('validity', 'DAY'),
            "exchange": order_params.get('exchange', 'NSE'),
            "segment": order_params.get('segment', 'CASH'),
            "product": order_params.get('product', 'CNC'),
            "order_type": order_params.get('order_type', 'MARKET'),
            "transaction_type": order_params.get('transaction_type'),
            "order_reference_id": order_params.get('order_reference_id', f"AI-{int(time.time())}")
        }

        # Remove None values
        groww_order_payload = {k: v for k, v in groww_order_payload.items() if v is not None}

        logger.info(f"📡 Calling Groww API: {groww_url}")
        logger.info(f"📝 Payload: {groww_order_payload}")

        # Make request to Groww API
        groww_response = requests.post(
            groww_url,
            json=groww_order_payload,
            headers=headers,
            timeout=30
        )

        logger.info(f"📊 Groww API response status: {groww_response.status_code}")
        logger.info(f"📊 Groww API response: {groww_response.text}")

        if groww_response.status_code == 200 or groww_response.status_code == 201:
            groww_data = groww_response.json()

            response_data = {
                "status": "SUCCESS",
                "payload": groww_data.get('payload', groww_data),
                "paper_trading": False
            }

            logger.info(f"✅ Order placed successfully: {response_data}")

            response = jsonify(response_data)
            response.headers.add('Access-Control-Allow-Origin', '*')
            logger.info(f"📤 Response: 200 for POST /api/place-order (LIVE ORDER)")
            return response, 200
        else:
            logger.error(f"❌ Groww API error: {groww_response.status_code} - {groww_response.text}")
            return jsonify({
                "status": "FAILED",
                "error": f"Groww API error: {groww_response.text}"
            }), groww_response.status_code

    except Exception as e:
        logger.error(f"❌ Error in /api/place-order: {e}")
        return jsonify({
            "status": "FAILED",
            "error": str(e)
        }), 500

@app.route('/api/order-status/<order_id>', methods=['GET', 'OPTIONS'])
def get_order_status(order_id):
    """Get order status from Groww API"""

    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response, 200

    logger.info(f"📊 Checking order status for: {order_id}")

    try:
        # Handle paper trading orders
        if order_id.startswith('PAPER-'):
            response_data = {
                "status": "SUCCESS",
                "payload": {
                    "groww_order_id": order_id,
                    "order_status": "PAPER_TRADE_COMPLETE",
                    "remark": "Paper trading order (simulation)"
                }
            }

            response = jsonify(response_data)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 200

        # Get real order status from Groww
        token = auth_manager.get_access_token()
        if not token:
            return jsonify({
                "status": "FAILED",
                "error": "Authentication token not available"
            }), 401

        import requests
        groww_url = f"https://api.groww.in/v1/order/{order_id}"

        headers = {
            'Authorization': f'Bearer {token}',
            'X-API-VERSION': '1.0'
        }

        groww_response = requests.get(groww_url, headers=headers, timeout=10)

        if groww_response.status_code == 200:
            groww_data = groww_response.json()

            response_data = {
                "status": "SUCCESS",
                "payload": groww_data.get('payload', groww_data)
            }

            response = jsonify(response_data)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 200
        else:
            return jsonify({
                "status": "FAILED",
                "error": f"Groww API error: {groww_response.text}"
            }), groww_response.status_code

    except Exception as e:
        logger.error(f"❌ Error in /api/order-status/{order_id}: {e}")
        return jsonify({
            "status": "FAILED",
            "error": str(e)
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

def keep_alive():
    """Keep Railway service awake by making periodic health check requests"""
    import time
    import requests
    
    def ping_self():
        while True:
            try:
                time.sleep(240)  # Wait 4 minutes between pings
                # Make a request to our own health endpoint
                port = os.getenv('PORT', '8080')
                url = f"http://localhost:{port}/"
                
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    logger.info("🔄 Keep-alive ping successful")
                else:
                    logger.warning(f"⚠️ Keep-alive ping returned {response.status_code}")
                    
            except Exception as e:
                logger.warning(f"⚠️ Keep-alive ping failed: {e}")
    
    # Start the keep-alive thread
    ping_thread = threading.Thread(target=ping_self, daemon=True)
    ping_thread.start()
    logger.info("🔄 Keep-alive mechanism started (pings every 4 minutes)")

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
    
    # Start keep-alive for direct Flask run
    keep_alive()
    
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
else:
    # When running with gunicorn (Railway production)
    start_time = time.time()
    logger.info("🚀 Groww Authentication Service started with gunicorn")
    logger.info(f"🔧 Available routes: {[rule.rule for rule in app.url_map.iter_rules()]}")
    if auth_manager.is_configured():
        logger.info("✅ Service fully configured and ready")
    else:
        logger.warning("⚠️  Service running with incomplete configuration")
    
    # Start keep-alive for gunicorn (Railway)
    keep_alive()