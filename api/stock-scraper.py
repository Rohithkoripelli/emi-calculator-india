#!/usr/bin/env python3
"""
Enhanced Stock Data Scraper with BeautifulSoup
Provides robust web scraping for Indian stock market data
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
from urllib.parse import urlencode, quote_plus
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StockDataScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        
    def search_and_scrape_stock_data(self, symbol: str, company_name: str) -> Dict[str, Any]:
        """
        Complete pipeline: Google search -> Scrape financial sites -> Extract data
        """
        logger.info(f"Starting comprehensive stock data collection for {symbol} ({company_name})")
        
        # Step 1: Get relevant URLs from Google Custom Search
        search_urls = self._get_stock_urls_from_google(symbol, company_name)
        
        # Step 2: Scrape each URL for stock data
        scraped_data = []
        for url_info in search_urls:
            try:
                data = self._scrape_financial_site(url_info['url'], symbol)
                if data:
                    data['source'] = url_info['source']
                    data['url'] = url_info['url']
                    scraped_data.append(data)
                    logger.info(f"✅ Successfully scraped data from {url_info['source']}")
                time.sleep(1)  # Be respectful to websites
            except Exception as e:
                logger.warning(f"⚠️ Failed to scrape {url_info['source']}: {str(e)}")
                continue
        
        # Step 3: Consolidate and clean the data
        consolidated_data = self._consolidate_stock_data(scraped_data, symbol, company_name)
        
        return consolidated_data
    
    def _get_stock_urls_from_google(self, symbol: str, company_name: str) -> List[Dict[str, str]]:
        """
        Use Google Custom Search API to find relevant financial website URLs
        """
        api_key = os.getenv('REACT_APP_GOOGLE_SEARCH_API_KEY')
        search_engine_id = os.getenv('REACT_APP_GOOGLE_SEARCH_ENGINE_ID')
        
        if not api_key or not search_engine_id:
            logger.warning("Google API credentials not available, using fallback URLs")
            return self._get_fallback_urls(symbol, company_name)
        
        search_query = f"{company_name} {symbol} stock price NSE BSE live"
        
        try:
            params = {
                'key': api_key,
                'cx': search_engine_id,
                'q': search_query,
                'num': 10,
                'gl': 'in',
                'lr': 'lang_en'
            }
            
            response = requests.get('https://www.googleapis.com/customsearch/v1', params=params)
            
            if response.status_code == 200:
                data = response.json()
                urls = []
                
                for item in data.get('items', []):
                    url = item.get('link')
                    source = self._extract_source_name(url)
                    if self._is_financial_site(url):
                        urls.append({'url': url, 'source': source})
                
                logger.info(f"Found {len(urls)} relevant financial URLs from Google")
                return urls[:5]  # Top 5 results
            else:
                logger.warning(f"Google API error: {response.status_code}")
                return self._get_fallback_urls(symbol, company_name)
                
        except Exception as e:
            logger.error(f"Google search failed: {str(e)}")
            return self._get_fallback_urls(symbol, company_name)
    
    def _get_fallback_urls(self, symbol: str, company_name: str) -> List[Dict[str, str]]:
        """
        Fallback URLs when Google API is not available
        """
        return [
            {
                'url': f'https://www.moneycontrol.com/india/stockpricequote/{symbol.lower()}',
                'source': 'MoneyControl'
            },
            {
                'url': f'https://www.nseindia.com/get-quotes/equity?symbol={symbol}',
                'source': 'NSE India'
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
                'url': f'https://www.livemint.com/market/stock-market-news',
                'source': 'LiveMint'
            }
        ]
    
    def _is_financial_site(self, url: str) -> bool:
        """
        Check if URL is from a known financial website
        """
        financial_domains = [
            'moneycontrol.com', 'nseindia.com', 'bseindia.com', 'yahoo.com',
            'economictimes.indiatimes.com', 'livemint.com', 'business-standard.com',
            'zeebiz.com', 'investing.com', 'marketwatch.com', 'bloomberg.com',
            'reuters.com', 'cnbc.com', 'financialexpress.com'
        ]
        
        return any(domain in url.lower() for domain in financial_domains)
    
    def _extract_source_name(self, url: str) -> str:
        """
        Extract clean source name from URL
        """
        domain_map = {
            'moneycontrol.com': 'MoneyControl',
            'nseindia.com': 'NSE India',
            'bseindia.com': 'BSE India',
            'finance.yahoo.com': 'Yahoo Finance',
            'economictimes.indiatimes.com': 'Economic Times',
            'livemint.com': 'LiveMint',
            'business-standard.com': 'Business Standard',
            'zeebiz.com': 'Zee Business',
            'investing.com': 'Investing.com',
            'bloomberg.com': 'Bloomberg',
            'reuters.com': 'Reuters'
        }
        
        for domain, name in domain_map.items():
            if domain in url.lower():
                return name
        
        return 'Financial News'
    
    def _scrape_financial_site(self, url: str, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Scrape stock data from a financial website using BeautifulSoup
        """
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try different extraction strategies based on the website
            if 'moneycontrol.com' in url:
                return self._scrape_moneycontrol(soup, symbol)
            elif 'yahoo.com' in url:
                return self._scrape_yahoo_finance(soup, symbol)
            elif 'nseindia.com' in url:
                return self._scrape_nse(soup, symbol)
            elif 'economictimes.indiatimes.com' in url:
                return self._scrape_economic_times(soup, symbol)
            else:
                return self._scrape_generic_financial_site(soup, symbol)
                
        except Exception as e:
            logger.error(f"Error scraping {url}: {str(e)}")
            return None
    
    def _scrape_moneycontrol(self, soup: BeautifulSoup, symbol: str) -> Dict[str, Any]:
        """
        Scrape MoneyControl website
        """
        data = {}
        
        # Look for price data
        price_selectors = [
            '.pcnstkprc', '.prc_flot', '.FL .gD_12', 
            '[data-field="last_price"]', '.prc'
        ]
        
        for selector in price_selectors:
            price_elem = soup.select_one(selector)
            if price_elem:
                price_text = self._clean_number(price_elem.text)
                if price_text:
                    data['current_price'] = price_text
                    break
        
        # Look for change percentage
        change_selectors = [
            '.gD_12 .FL', '.prcntchng', '[data-field="percentage_change"]'
        ]
        
        for selector in change_selectors:
            change_elem = soup.select_one(selector)
            if change_elem:
                change_text = self._extract_percentage(change_elem.text)
                if change_text:
                    data['change_percent'] = change_text
                    break
        
        # Look for day high/low
        high_elem = soup.select_one('[data-field="day_high"], .dayrangetd .FL')
        if high_elem:
            data['day_high'] = self._clean_number(high_elem.text)
            
        low_elem = soup.select_one('[data-field="day_low"], .dayrangetd .FR')
        if low_elem:
            data['day_low'] = self._clean_number(low_elem.text)
        
        return data if data else None
    
    def _scrape_yahoo_finance(self, soup: BeautifulSoup, symbol: str) -> Dict[str, Any]:
        """
        Scrape Yahoo Finance website
        """
        data = {}
        
        # Price selectors for Yahoo Finance
        price_elem = soup.select_one('[data-symbol] .Fw\\(b\\) .Fz\\(36px\\)')
        if not price_elem:
            price_elem = soup.select_one('.D\\(ib\\) .Fw\\(b\\) .Fz\\(36px\\)')
        if not price_elem:
            price_elem = soup.select_one('[data-test="qsp-price"]')
            
        if price_elem:
            data['current_price'] = self._clean_number(price_elem.text)
        
        # Change percentage
        change_elem = soup.select_one('[data-test="qsp-price-change-percent"]')
        if change_elem:
            data['change_percent'] = self._extract_percentage(change_elem.text)
        
        return data if data else None
    
    def _scrape_nse(self, soup: BeautifulSoup, symbol: str) -> Dict[str, Any]:
        """
        Scrape NSE India website
        """
        data = {}
        
        # NSE has dynamic content, look for JSON data
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string and 'lastPrice' in script.string:
                try:
                    # Extract JSON data from script tag
                    json_text = re.search(r'(\{.*\})', script.string)
                    if json_text:
                        json_data = json.loads(json_text.group(1))
                        if 'lastPrice' in json_data:
                            data['current_price'] = float(json_data['lastPrice'])
                        if 'pChange' in json_data:
                            data['change_percent'] = float(json_data['pChange'])
                        if 'dayHigh' in json_data:
                            data['day_high'] = float(json_data['dayHigh'])
                        if 'dayLow' in json_data:
                            data['day_low'] = float(json_data['dayLow'])
                        break
                except:
                    continue
        
        return data if data else None
    
    def _scrape_economic_times(self, soup: BeautifulSoup, symbol: str) -> Dict[str, Any]:
        """
        Scrape Economic Times website
        """
        data = {}
        
        # Economic Times price selectors
        price_elem = soup.select_one('.price .number')
        if price_elem:
            data['current_price'] = self._clean_number(price_elem.text)
        
        change_elem = soup.select_one('.change .number')
        if change_elem:
            data['change_percent'] = self._extract_percentage(change_elem.text)
        
        return data if data else None
    
    def _scrape_generic_financial_site(self, soup: BeautifulSoup, symbol: str) -> Dict[str, Any]:
        """
        Generic scraping for unknown financial websites
        """
        data = {}
        text = soup.get_text().lower()
        
        # Look for price patterns in the text
        price_patterns = [
            r'₹\s*([0-9,]+(?:\.[0-9]{1,2})?)',
            r'rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)',
            r'price[:\s]*([0-9,]+(?:\.[0-9]{1,2})?)',
            r'([0-9,]+(?:\.[0-9]{1,2})?)\s*rupees'
        ]
        
        for pattern in price_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                price = self._clean_number(match)
                if price and 1 <= price <= 100000:  # Reasonable price range
                    data['current_price'] = price
                    break
            if 'current_price' in data:
                break
        
        # Look for percentage change
        percent_pattern = r'([+-]?\d+(?:\.\d+)?)\s*%'
        percent_matches = re.findall(percent_pattern, text)
        if percent_matches:
            data['change_percent'] = float(percent_matches[0])
        
        return data if data else None
    
    def _clean_number(self, text: str) -> Optional[float]:
        """
        Clean and convert text to number
        """
        if not text:
            return None
            
        # Remove common formatting
        cleaned = re.sub(r'[^\d.-]', '', text.replace(',', ''))
        
        try:
            return float(cleaned)
        except ValueError:
            return None
    
    def _extract_percentage(self, text: str) -> Optional[float]:
        """
        Extract percentage from text
        """
        if not text:
            return None
            
        # Look for percentage patterns
        percent_match = re.search(r'([+-]?\d+(?:\.\d+)?)', text.replace('%', ''))
        if percent_match:
            try:
                return float(percent_match.group(1))
            except ValueError:
                return None
        return None
    
    def _consolidate_stock_data(self, scraped_data: List[Dict], symbol: str, company_name: str) -> Dict[str, Any]:
        """
        Consolidate data from multiple sources
        """
        consolidated = {
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
            return consolidated
        
        # Aggregate prices and find consensus
        prices = [d.get('current_price') for d in scraped_data if d.get('current_price')]
        change_percents = [d.get('change_percent') for d in scraped_data if d.get('change_percent')]
        day_highs = [d.get('day_high') for d in scraped_data if d.get('day_high')]
        day_lows = [d.get('day_low') for d in scraped_data if d.get('day_low')]
        
        # Use median for more reliable consensus
        if prices:
            consolidated['current_price'] = sorted(prices)[len(prices)//2]
        if change_percents:
            consolidated['change_percent'] = sorted(change_percents)[len(change_percents)//2]
        if day_highs:
            consolidated['day_high'] = sorted(day_highs)[len(day_highs)//2]
        if day_lows:
            consolidated['day_low'] = sorted(day_lows)[len(day_lows)//2]
        
        # Set data quality based on number of sources
        consolidated['sources'] = [d.get('source', 'Unknown') for d in scraped_data]
        if len(scraped_data) >= 3:
            consolidated['data_quality'] = 'high'
        elif len(scraped_data) >= 2:
            consolidated['data_quality'] = 'medium'
        
        logger.info(f"✅ Consolidated data from {len(scraped_data)} sources for {symbol}")
        return consolidated

# Flask API endpoints (if running as a web service)
def create_flask_app():
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    
    app = Flask(__name__)
    CORS(app)
    
    scraper = StockDataScraper()
    
    @app.route('/api/scrape-stock', methods=['POST'])
    def scrape_stock():
        try:
            data = request.get_json()
            symbol = data.get('symbol', '').upper()
            company_name = data.get('company_name', symbol)
            
            if not symbol:
                return jsonify({'error': 'Symbol is required'}), 400
            
            result = scraper.search_and_scrape_stock_data(symbol, company_name)
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"API error: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'healthy', 'service': 'stock-scraper'})
    
    return app

# Command line interface
if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        # CLI mode
        if len(sys.argv) >= 3:
            symbol = sys.argv[1].upper()
            company_name = sys.argv[2]
        else:
            symbol = sys.argv[1].upper()
            company_name = symbol
        
        scraper = StockDataScraper()
        result = scraper.search_and_scrape_stock_data(symbol, company_name)
        print(json.dumps(result, indent=2))
    else:
        # Web service mode
        app = create_flask_app()
        app.run(host='0.0.0.0', port=5000, debug=True)