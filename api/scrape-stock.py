#!/usr/bin/env python3
"""
Vercel Serverless Function for Stock Data Scraping
Enhanced with BeautifulSoup for robust data extraction
"""

import json
import re
import time
from urllib.parse import urlencode
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import os

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    # Fallback for serverless environment
    import urllib.request
    import urllib.parse

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VercelStockScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        }
    
    def scrape_stock_data(self, symbol: str, company_name: str) -> Dict[str, Any]:
        """
        Main scraping function optimized for Vercel serverless
        """
        logger.info(f"Scraping stock data for {symbol} ({company_name})")
        
        # Get URLs from Google Custom Search or fallback
        search_urls = self._get_stock_urls(symbol, company_name)
        
        # Scrape data from top 3 sources (serverless time limit)
        scraped_data = []
        for i, url_info in enumerate(search_urls[:3]):
            try:
                data = self._scrape_single_source(url_info, symbol)
                if data:
                    scraped_data.append(data)
                    logger.info(f"✅ Data from {url_info['source']}")
                
                # Respect serverless time limits
                if i < len(search_urls) - 1:
                    time.sleep(0.5)
                    
            except Exception as e:
                logger.warning(f"⚠️ Failed {url_info['source']}: {str(e)}")
                continue
        
        # Consolidate results
        return self._consolidate_data(scraped_data, symbol, company_name)
    
    def _get_stock_urls(self, symbol: str, company_name: str) -> List[Dict[str, str]]:
        """
        Get stock URLs from Google Custom Search API or fallback
        """
        api_key = os.environ.get('GOOGLE_SEARCH_API_KEY')
        search_engine_id = os.environ.get('GOOGLE_SEARCH_ENGINE_ID')
        
        if api_key and search_engine_id:
            try:
                return self._google_search_urls(symbol, company_name, api_key, search_engine_id)
            except Exception as e:
                logger.warning(f"Google search failed: {e}")
        
        # Fallback URLs
        return self._get_fallback_urls(symbol, company_name)
    
    def _google_search_urls(self, symbol: str, company_name: str, api_key: str, search_engine_id: str) -> List[Dict[str, str]]:
        """
        Get URLs from Google Custom Search API
        """
        search_query = f"{company_name} {symbol} stock price NSE BSE live"
        
        params = {
            'key': api_key,
            'cx': search_engine_id,
            'q': search_query,
            'num': 5,
            'gl': 'in',
            'lr': 'lang_en'
        }
        
        try:
            import requests
            response = requests.get('https://www.googleapis.com/customsearch/v1', params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                urls = []
                
                for item in data.get('items', []):
                    url = item.get('link')
                    if self._is_financial_site(url):
                        source = self._extract_source_name(url)
                        urls.append({'url': url, 'source': source})
                
                logger.info(f"Found {len(urls)} URLs from Google")
                return urls[:5]
            else:
                raise Exception(f"Google API error: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Google search error: {e}")
            return self._get_fallback_urls(symbol, company_name)
    
    def _get_fallback_urls(self, symbol: str, company_name: str) -> List[Dict[str, str]]:
        """
        Fallback financial URLs when Google search fails
        """
        return [
            {
                'url': f'https://www.moneycontrol.com/india/stockpricequote/{symbol.lower()}',
                'source': 'MoneyControl'
            },
            {
                'url': f'https://finance.yahoo.com/quote/{symbol}.NS',
                'source': 'Yahoo Finance'
            },
            {
                'url': f'https://economictimes.indiatimes.com/markets/stocks/stock-quotes?ticker={symbol}',
                'source': 'Economic Times'
            },
            {
                'url': f'https://www.nseindia.com/get-quotes/equity?symbol={symbol}',
                'source': 'NSE India'
            }
        ]
    
    def _is_financial_site(self, url: str) -> bool:
        """Check if URL is from a financial website"""
        financial_domains = [
            'moneycontrol.com', 'nseindia.com', 'bseindia.com', 'yahoo.com',
            'economictimes.indiatimes.com', 'livemint.com', 'business-standard.com',
            'zeebiz.com', 'investing.com', 'marketwatch.com'
        ]
        return any(domain in url.lower() for domain in financial_domains)
    
    def _extract_source_name(self, url: str) -> str:
        """Extract source name from URL"""
        domain_map = {
            'moneycontrol.com': 'MoneyControl',
            'nseindia.com': 'NSE India',
            'finance.yahoo.com': 'Yahoo Finance',
            'economictimes.indiatimes.com': 'Economic Times',
            'livemint.com': 'LiveMint',
            'business-standard.com': 'Business Standard'
        }
        
        for domain, name in domain_map.items():
            if domain in url.lower():
                return name
        return 'Financial Site'
    
    def _scrape_single_source(self, url_info: Dict, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Scrape a single financial website
        """
        try:
            # Try with requests first, fallback to urllib
            try:
                import requests
                response = requests.get(url_info['url'], headers=self.headers, timeout=5)
                html_content = response.text
            except:
                # Fallback for environments without requests
                req = urllib.request.Request(url_info['url'], headers=self.headers)
                response = urllib.request.urlopen(req, timeout=5)
                html_content = response.read().decode('utf-8')
            
            # Parse with BeautifulSoup if available, otherwise use regex
            try:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(html_content, 'html.parser')
                return self._extract_with_beautifulsoup(soup, url_info['source'], symbol)
            except:
                # Fallback to regex parsing
                return self._extract_with_regex(html_content, url_info['source'], symbol)
                
        except Exception as e:
            logger.error(f"Error scraping {url_info['source']}: {e}")
            return None
    
    def _extract_with_beautifulsoup(self, soup, source: str, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Extract data using BeautifulSoup (preferred method)
        """
        data = {'source': source}
        
        # Source-specific selectors
        if 'moneycontrol' in source.lower():
            # MoneyControl selectors
            price_selectors = ['.pcnstkprc', '.prc_flot', '.FL .gD_12', '[data-field="last_price"]']
            change_selectors = ['.gD_12 .FL', '.prcntchng', '[data-field="percentage_change"]']
            
        elif 'yahoo' in source.lower():
            # Yahoo Finance selectors
            price_selectors = ['[data-test="qsp-price"]', '.Fw\\(b\\) .Fz\\(36px\\)', '.Trsdu\\(0\\.3s\\)']
            change_selectors = ['[data-test="qsp-price-change-percent"]', '.Fw\\(500\\)']
            
        elif 'economic times' in source.lower():
            # Economic Times selectors
            price_selectors = ['.price .number', '.last-price', '.current-price']
            change_selectors = ['.change .number', '.percentage-change']
            
        else:
            # Generic selectors
            price_selectors = ['.price', '.current-price', '.last-price', '.ltp']
            change_selectors = ['.change', '.percentage', '.change-percent']
        
        # Extract price
        for selector in price_selectors:
            try:
                elem = soup.select_one(selector)
                if elem:
                    price = self._clean_number(elem.get_text())
                    if price and price > 0:
                        data['current_price'] = price
                        break
            except:
                continue
        
        # Extract change percentage
        for selector in change_selectors:
            try:
                elem = soup.select_one(selector)
                if elem:
                    change = self._extract_percentage(elem.get_text())
                    if change is not None:
                        data['change_percent'] = change
                        break
            except:
                continue
        
        return data if 'current_price' in data else None
    
    def _extract_with_regex(self, html_content: str, source: str, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fallback extraction using regex patterns
        """
        data = {'source': source}
        text = html_content.lower()
        
        # Price patterns for Indian stocks
        price_patterns = [
            r'₹\s*([0-9,]+(?:\.[0-9]{1,2})?)',
            r'rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)',
            r'"price"[:\s]*([0-9,]+(?:\.[0-9]{1,2})?)',
            r'current[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)',
            r'last[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)'
        ]
        
        for pattern in price_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                price = self._clean_number(match)
                if price and 1 <= price <= 100000:
                    data['current_price'] = price
                    break
            if 'current_price' in data:
                break
        
        # Percentage change patterns
        percent_patterns = [
            r'([+-]?\d+(?:\.\d+)?)\s*%',
            r'change[:\s]*([+-]?\d+(?:\.\d+)?)\s*%'
        ]
        
        for pattern in percent_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                try:
                    change = float(match)
                    if -50 <= change <= 50:  # Reasonable range
                        data['change_percent'] = change
                        break
                except:
                    continue
            if 'change_percent' in data:
                break
        
        return data if 'current_price' in data else None
    
    def _clean_number(self, text: str) -> Optional[float]:
        """Clean and convert text to number"""
        if not text:
            return None
        
        # Remove formatting and convert
        cleaned = re.sub(r'[^\d.-]', '', str(text).replace(',', ''))
        try:
            return float(cleaned)
        except:
            return None
    
    def _extract_percentage(self, text: str) -> Optional[float]:
        """Extract percentage from text"""
        if not text:
            return None
        
        percent_match = re.search(r'([+-]?\d+(?:\.\d+)?)', str(text).replace('%', ''))
        if percent_match:
            try:
                return float(percent_match.group(1))
            except:
                return None
        return None
    
    def _consolidate_data(self, scraped_data: List[Dict], symbol: str, company_name: str) -> Dict[str, Any]:
        """
        Consolidate data from multiple sources
        """
        result = {
            'symbol': symbol,
            'company_name': company_name,
            'current_price': 0,
            'change_percent': 0,
            'day_high': 0,
            'day_low': 0,
            'volume': 0,
            'last_updated': datetime.now().isoformat(),
            'sources': [],
            'data_quality': 'low'
        }
        
        if not scraped_data:
            return result
        
        # Extract prices and changes
        prices = [d.get('current_price') for d in scraped_data if d.get('current_price')]
        changes = [d.get('change_percent') for d in scraped_data if d.get('change_percent')]
        
        # Use median for consensus
        if prices:
            prices.sort()
            result['current_price'] = prices[len(prices)//2]
        
        if changes:
            changes.sort()
            result['change_percent'] = changes[len(changes)//2]
        
        # Set quality based on sources
        result['sources'] = [d.get('source', 'Unknown') for d in scraped_data]
        if len(scraped_data) >= 3:
            result['data_quality'] = 'high'
        elif len(scraped_data) >= 2:
            result['data_quality'] = 'medium'
        
        logger.info(f"✅ Consolidated from {len(scraped_data)} sources: {symbol}")
        return result

def handler(request):
    """
    Vercel serverless function handler
    """
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Handle OPTIONS (CORS preflight)
    if request.method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # Parse request
        if request.method == 'POST':
            if hasattr(request, 'get_json'):
                data = request.get_json()
            else:
                import json
                body = request.get('body', '{}')
                if isinstance(body, bytes):
                    body = body.decode('utf-8')
                data = json.loads(body) if body else {}
        else:
            # GET request - parse query params
            symbol = request.args.get('symbol', '')
            company_name = request.args.get('company_name', symbol)
            data = {'symbol': symbol, 'company_name': company_name}
        
        symbol = data.get('symbol', '').upper()
        company_name = data.get('company_name', symbol)
        
        if not symbol:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Symbol is required'})
            }
        
        # Initialize scraper and get data
        scraper = VercelStockScraper()
        result = scraper.scrape_stock_data(symbol, company_name)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        logger.error(f"Handler error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

# For local testing
if __name__ == '__main__':
    class MockRequest:
        def __init__(self, method='POST', data=None):
            self.method = method
            self._data = data or {'symbol': 'TCS', 'company_name': 'Tata Consultancy Services'}
        
        def get_json(self):
            return self._data
    
    # Test the function
    mock_request = MockRequest()
    result = handler(mock_request)
    print(json.dumps(json.loads(result['body']), indent=2))