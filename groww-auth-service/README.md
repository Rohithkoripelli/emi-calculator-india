# Groww Authentication Service

A Python Flask service for handling Groww API authentication using API Key + TOTP mechanism.

## Railway Deployment

This service is configured for Railway deployment with:
- Python 3.11 runtime
- Automatic dependency installation
- Gunicorn WSGI server
- Environment variable configuration

## Environment Variables

Set these in Railway:
- `GROWW_API_KEY` - Your Groww API key
- `GROWW_API_SECRET` - Your Groww TOTP secret
- `FLASK_ENV` - Set to "production"

## Endpoints

- `GET /` - Health check
- `GET /auth/status` - Service status
- `POST /auth/token` - Get access token
- `POST /auth/test` - Test authentication

## Local Testing

```bash
# Set environment variables
export GROWW_API_KEY='your_key'
export GROWW_API_SECRET='your_secret'

# Run setup
./setup_local_test.sh

# Start service
python app.py

# Test service
python test_auth.py
```