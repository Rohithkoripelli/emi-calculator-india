import { HybridStockApiService } from './hybridStockApi';
import { GoogleSearchApiService } from './googleSearchApi';
import { WebScrapingService, ScrapedStockData } from './webScrapingService';
import { ExcelBasedStockAnalysisService } from './excelBasedStockAnalysis';

export interface StockAnalysisData {
  symbol: string;
  companyName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  sector: string;
  industry: string;
  weeklyChange?: number;
  monthlyChange?: number;
  yearlyChange?: number;
  high52Week?: number;
  low52Week?: number;
  lastUpdated: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  source: string;
}

export interface StockRecommendation {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  reasoning: string[];
  targetPrice?: number;
  stopLoss?: number;
  timeHorizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
}

export interface StockAnalysisResult {
  stockData: StockAnalysisData;
  webInsights: WebSearchResult[];
  recommendation: StockRecommendation;
  analysisDate: string;
  disclaimers: string[];
}

export class StockAnalysisApiService {
  private static readonly CORS_PROXY = 'https://api.allorigins.win/get?url=';
  
  // Enhanced stock keywords for better detection
  private static readonly STOCK_KEYWORDS = [
    'stock', 'share', 'shares', 'equity', 'buy', 'sell', 'invest', 'investment', 'price', 'analysis', 
    'recommendation', 'target', 'trading', 'market', 'nse', 'bse', 'sensex', 'nifty',
    'portfolio', 'holding', 'dividend', 'returns', 'profit', 'loss', 'company', 'sector',
    'industry', 'listing', 'ipo', 'earnings', 'quarterly', 'results', 'financial'
  ];

  // Query intent classification keywords - more specific patterns
  private static readonly BUY_SELL_PATTERNS = [
    'should i buy', 'should i sell', 'should i invest', 'worth buying', 'worth selling',
    'good investment', 'bad investment', 'buy or sell', 'recommend buying', 'recommend selling',
    'advice on buying', 'advice on selling', 'suggest buying', 'suggest selling',
    'good to buy', 'good to sell', 'time to buy', 'time to sell', 'buy now', 'sell now'
  ];
  
  private static readonly ANALYSIS_PATTERNS = [
    'analysis of', 'financial analysis', 'stock analysis', 'company analysis',
    'financial report', 'annual report', 'quarterly report', 'performance report',
    'business overview', 'company overview', 'financial overview',
    'fundamentals of', 'technical analysis of', 'company profile',
    'business model', 'revenue details', 'profit details', 'earnings report',
    'balance sheet', 'cash flow', 'give me analysis', 'provide analysis',
    'detailed analysis', 'complete analysis', 'full analysis'
  ];

  private static readonly IPO_PATTERNS = [
    'ipo', 'initial public offering', 'public listing', 'listing date',
    'ipo price', 'ipo launch', 'going public', 'stock listing',
    'ipo details', 'ipo news', 'ipo announcement', 'ipo application'
  ];

  // Comprehensive Indian stock symbols database (440+ entries)
  // Auto-generated from comprehensive database covering all major sectors
  private static readonly INDIAN_STOCKS = {
    'abbott india': 'ABBOTINDIA', 'abbotindia': 'ABBOTINDIA', 'abbott': 'ABBOTINDIA',
    'aditya birla fashion': 'ABFRL', 'abfrl': 'ABFRL', 'pantaloons': 'ABFRL',
    'acc': 'ACC', 'acc limited': 'ACC',
    'adani green energy': 'ADANIGREEN', 'adanigreen': 'ADANIGREEN',
    'adani power': 'ADANIPOWER', 'adanipower': 'ADANIPOWER',
    'adani transmission': 'ADANITRANS', 'adanitrans': 'ADANITRANS',
    'alkem laboratories': 'ALKEM', 'alkem': 'ALKEM',
    'amber enterprises': 'AMBER', 'amber': 'AMBER',
    'ambuja cements': 'AMBUJACEM', 'ambujacem': 'AMBUJACEM', 'ambuja': 'AMBUJACEM',
    'apollo hospitals': 'APOLLOHOSP', 'apollohosp': 'APOLLOHOSP', 'apollo': 'APOLLOHOSP',
    'arvind': 'ARVIND', 'arvind limited': 'ARVIND',
    'ashok leyland': 'ASHOKLEY', 'ashokley': 'ASHOKLEY',
    'aster dm healthcare': 'ASTERDM', 'asterdm': 'ASTERDM', 'aster': 'ASTERDM',
    'aurobindo pharma': 'AUROPHARMA', 'auropharma': 'AUROPHARMA', 'aurobindo': 'AUROPHARMA',
    'axis bank': 'AXISBANK', 'axisbank': 'AXISBANK', 'axis': 'AXISBANK',
    'bajaj auto': 'BAJAJ-AUTO', 'bajajauto': 'BAJAJ-AUTO', 'bajaj': 'BAJAJ-AUTO',
    'bajaj electricals': 'BAJAJELEC', 'bajajelec': 'BAJAJELEC',
    'bajaj finserv': 'BAJAJFINSV', 'bajajfinsv': 'BAJAJFINSV',
    'bajaj finance': 'BAJFINANCE', 'bajfinance': 'BAJFINANCE',
    'balaji telefilms': 'BALAJITELE', 'balajitele': 'BALAJITELE', 'balaji': 'BALAJITELE',
    'bank of baroda': 'BANKBARODA', 'bankbaroda': 'BANKBARODA', 'bob': 'BANKBARODA',
    'bandhan bank': 'BANDHANBNK', 'bandhanbnk': 'BANDHANBNK',
    'bharti airtel': 'BHARTIARTL', 'bhartiartl': 'BHARTIARTL', 'airtel': 'BHARTIARTL',
    'biocon': 'BIOCON', 'biocon limited': 'BIOCON',
    'blue star': 'BLUESTARCO', 'bluestarco': 'BLUESTARCO',
    'bharat petroleum': 'BPCL', 'bpcl': 'BPCL', 'bharat petro': 'BPCL',
    'britannia industries': 'BRITANNIA', 'britannia': 'BRITANNIA',
    'byjus': 'BYJUS', 'think and learn': 'BYJUS',
    'cadila healthcare': 'CADILAHC', 'cadilahc': 'CADILAHC', 'zydus': 'CADILAHC',
    'canara bank': 'CANBK', 'canbk': 'CANBK',
    'cholamandalam finance': 'CHOLAFIN', 'cholafin': 'CHOLAFIN', 'chola': 'CHOLAFIN',
    'cipla': 'CIPLA', 'cipla limited': 'CIPLA',
    'coal india': 'COALINDIA', 'coalindia': 'COALINDIA', 'cil': 'COALINDIA',
    'colgate palmolive': 'COLPAL', 'colpal': 'COLPAL', 'colgate': 'COLPAL',
    'container corporation': 'CONCOR', 'concor': 'CONCOR',
    'coforge': 'COFORGE', 'coforge limited': 'COFORGE',
    'crompton greaves': 'CROMPTON', 'crompton': 'CROMPTON',
    'dabur india': 'DABUR', 'dabur': 'DABUR',
    'dalmia bharat': 'DALMIABHA', 'dalmiabha': 'DALMIABHA', 'dalmia': 'DALMIABHA',
    'dilip buildcon': 'DBL', 'dbl': 'DBL',
    'devyani international': 'DEVYANI', 'devyani': 'DEVYANI', 'kfc': 'DEVYANI',
    'dixon technologies': 'DIXON', 'dixon': 'DIXON',
    'avenue supermarts': 'DMART', 'dmart': 'DMART', 'd mart': 'DMART',
    'dr reddys laboratories': 'DRREDDY', 'drreddy': 'DRREDDY', 'dr reddy': 'DRREDDY',
    'eicher motors': 'EICHERMOT', 'eichermot': 'EICHERMOT', 'eicher': 'EICHERMOT',
    'emami': 'EMAMI', 'emami limited': 'EMAMI',
    'escorts': 'ESCORTS', 'escorts limited': 'ESCORTS',
    'federal bank': 'FEDERALBNK', 'federalbnk': 'FEDERALBNK',
    'fino payments bank': 'FINO', 'fino': 'FINO',
    'force motors': 'FORCEMOT', 'forcemot': 'FORCEMOT',
    'fortis healthcare': 'FORTIS', 'fortis': 'FORTIS',
    'future retail': 'FRETAIL', 'fretail': 'FRETAIL', 'big bazaar': 'FRETAIL',
    'gail': 'GAIL', 'gas authority of india': 'GAIL',
    'gati': 'GATI', 'gati limited': 'GATI',
    'glenmark pharmaceuticals': 'GLENMARK', 'glenmark': 'GLENMARK',
    'gmmco': 'GMMCO', 'gmmco limited': 'GMMCO',
    'godrej consumer products': 'GODREJCP', 'godrejcp': 'GODREJCP', 'godrej': 'GODREJCP',
    'grasim industries': 'GRASIM', 'grasim': 'GRASIM',
    'gtl infrastructure': 'GTLINFRA', 'gtlinfra': 'GTLINFRA', 'gtl': 'GTLINFRA',
    'havells india': 'HAVELLS', 'havells': 'HAVELLS',
    'healthcare global': 'HCG', 'hcg': 'HCG',
    'hcl technologies': 'HCLTECH', 'hcltech': 'HCLTECH', 'hcl tech': 'HCLTECH', 'hcl': 'HCLTECH',
    'hdfc bank': 'HDFCBANK', 'hdfcbank': 'HDFCBANK', 'hdfc': 'HDFCBANK',
    'hdfc amc': 'HDFCAMC', 'hdfcamc': 'HDFCAMC',
    'hdfc life': 'HDFCLIFE', 'hdfclife': 'HDFCLIFE',
    'heritage foods': 'HERITGFOOD', 'heritgfood': 'HERITGFOOD', 'heritage': 'HERITGFOOD',
    'hero motocorp': 'HEROMOTOCO', 'heromotoco': 'HEROMOTOCO', 'hero': 'HEROMOTOCO',
    'hindalco industries': 'HINDALCO', 'hindalco': 'HINDALCO',
    'hindustan petroleum': 'HINDPETRO', 'hindpetro': 'HINDPETRO', 'hpcl': 'HINDPETRO',
    'hindustan unilever': 'HINDUNILVR', 'hindunilvr': 'HINDUNILVR', 'hul': 'HINDUNILVR',
    'hindustan zinc': 'HINDZINC', 'hindzinc': 'HINDZINC',
    'icici bank': 'ICICIBANK', 'icicibank': 'ICICIBANK', 'icici': 'ICICIBANK',
    'icici prudential': 'ICICIPRULI', 'icicipruli': 'ICICIPRULI', 'icici pru': 'ICICIPRULI',
    'vodafone idea': 'IDEA', 'idea': 'IDEA', 'vodafone': 'IDEA', 'vi': 'IDEA',
    'idfc first bank': 'IDFCFIRSTB', 'idfcfirstb': 'IDFCFIRSTB', 'idfc': 'IDFCFIRSTB',
    'interglobe aviation': 'INDIGO', 'indigo': 'INDIGO', 'interglobe': 'INDIGO',
    'indus towers': 'INDUSTOWER', 'industower': 'INDUSTOWER', 'indus': 'INDUSTOWER',
    'indusind bank': 'INDUSINDBK', 'indusindbk': 'INDUSINDBK', 'indusind': 'INDUSINDBK',
    'infosys': 'INFY', 'infy': 'INFY', 'infosys limited': 'INFY',
    'inox leisure': 'INOXLEISUR', 'inoxleisur': 'INOXLEISUR', 'inox': 'INOXLEISUR',
    'indian oil corporation': 'IOC', 'ioc': 'IOC', 'indian oil': 'IOC',
    'irb infrastructure': 'IRB', 'irb': 'IRB',
    'i r f c': 'IRFC', 'irfc': 'IRFC',
    'itc': 'ITC', 'itc limited': 'ITC',
    'jindal steel and power': 'JINDALSTEL', 'jindalstel': 'JINDALSTEL', 'jspl': 'JINDALSTEL',
    'jk cement': 'JKCEMENT', 'jkcement': 'JKCEMENT',
    'j kumar infraprojects': 'JKIL', 'jkil': 'JKIL',
    'jsw steel': 'JSWSTEEL', 'jswsteel': 'JSWSTEEL', 'jsw': 'JSWSTEEL',
    'jubilant foodworks': 'JUBLFOOD', 'jublfood': 'JUBLFOOD', 'dominos': 'JUBLFOOD',
    'justdial': 'JUSTDIAL', 'just dial': 'JUSTDIAL',
    'kec international': 'KEC', 'kec': 'KEC',
    'kohinoor foods': 'KOHINOOR', 'kohinoor': 'KOHINOOR',
    'kotak mahindra bank': 'KOTAKBANK', 'kotak bank': 'KOTAKBANK', 'kotak': 'KOTAKBANK',
    'krbl': 'KRBL', 'krbl limited': 'KRBL', 'india gate': 'KRBL',
    'dr lal path labs': 'LALPATHLAB', 'lalpathlab': 'LALPATHLAB', 'lal path lab': 'LALPATHLAB',
    'larsen and toubro': 'LT', 'lt': 'LT', 'l&t': 'LT', 'larsen toubro': 'LT',
    'l&t finance holdings': 'LTFH', 'ltfh': 'LTFH',
    'ltts': 'LTTS', 'l&t technology services': 'LTTS', 'larsen toubro tech': 'LTTS',
    'lupin': 'LUPIN', 'lupin limited': 'LUPIN',
    'mahindra and mahindra': 'M&M', 'm&m': 'M&M', 'mahindra': 'M&M',
    'mahindra finance': 'MAHINDRAFIN', 'mahindrafin': 'MAHINDRAFIN',
    'mahindra logistics': 'MAHLOG', 'mahlog': 'MAHLOG',
    'manappuram finance': 'MANAPPURAM', 'manappuram': 'MANAPPURAM',
    'marico': 'MARICO', 'marico limited': 'MARICO',
    'maruti suzuki': 'MARUTI', 'maruti': 'MARUTI', 'maruti suzuki india': 'MARUTI',
    'matrimony': 'MATRIMONY', 'matrimony.com': 'MATRIMONY',
    'max healthcare': 'MAXHEALTH', 'maxhealth': 'MAXHEALTH', 'max': 'MAXHEALTH',
    'united spirits': 'MCDOWELL-N', 'mcdowell': 'MCDOWELL-N',
    'metropolis healthcare': 'METROPOLIS', 'metropolis': 'METROPOLIS',
    'mindtree': 'MINDTREE', 'mindtree limited': 'MINDTREE',
    'mobikwik': 'MOBIKWIK', 'mobikwik systems': 'MOBIKWIK',
    'moil': 'MOIL', 'manganese ore india': 'MOIL',
    'mphasis': 'MPHASIS', 'mphasis limited': 'MPHASIS',
    'muthoot finance': 'MUTHOOTFIN', 'muthootfin': 'MUTHOOTFIN', 'muthoot': 'MUTHOOTFIN',
    'info edge': 'NAUKRI', 'naukri': 'NAUKRI', 'infoedge': 'NAUKRI',
    'ncc': 'NCC', 'nagarjuna construction': 'NCC',
    'nestle india': 'NESTLEIND', 'nestleind': 'NESTLEIND', 'nestle': 'NESTLEIND',
    'narayana hrudayalaya': 'NH', 'nh': 'NH', 'narayana': 'NH',
    'nmdc': 'NMDC', 'national mineral development': 'NMDC',
    'ntpc': 'NTPC', 'national thermal power corporation': 'NTPC',
    'nykaa': 'NYKAA', 'fsnl': 'NYKAA', 'nykaa limited': 'NYKAA', 'fashion and lifestyle': 'NYKAA',
    'oil and natural gas corporation': 'ONGC', 'ongc': 'ONGC',
    'page industries': 'PAGEIND', 'pageind': 'PAGEIND', 'jockey': 'PAGEIND',
    'parag milk foods': 'PARAGMILK', 'paragmilk': 'PARAGMILK', 'go cheese': 'PARAGMILK',
    'one97 communications': 'PAYTM', 'paytm': 'PAYTM', 'one97': 'PAYTM',
    'persistent systems': 'PERSISTENT', 'persistent': 'PERSISTENT',
    'punjab national bank': 'PNB', 'pnb': 'PNB',
    'pb fintech': 'POLICYBZR', 'policybazaar': 'POLICYBZR', 'policy bazaar': 'POLICYBZR',
    'power grid corporation': 'POWERGRID', 'powergrid': 'POWERGRID', 'power grid': 'POWERGRID',
    'pvr': 'PVR', 'pvr limited': 'PVR',
    'ramco cements': 'RAMCOCEM', 'ramcocem': 'RAMCOCEM', 'ramco': 'RAMCOCEM',
    'ratnamani metals': 'RATNAMANI', 'ratnamani': 'RATNAMANI',
    'raymond': 'RAYMOND', 'raymond limited': 'RAYMOND',
    'rbl bank': 'RBLBANK', 'rblbank': 'RBLBANK',
    'reliance industries': 'RELIANCE', 'reliance': 'RELIANCE', 'ril': 'RELIANCE', 'jio': 'RELIANCE', 'reliance jio': 'RELIANCE',
    'relaxo footwears': 'RELAXO', 'relaxo': 'RELAXO',
    'steel authority of india': 'SAIL', 'sail': 'SAIL',
    'sbi life': 'SBILIFE', 'sbilife': 'SBILIFE',
    'state bank of india': 'SBIN', 'sbi': 'SBIN', 'state bank': 'SBIN',
    'shoppers stop': 'SHOPERSTOP', 'shoperstop': 'SHOPERSTOP',
    'shree cement': 'SHREECEM', 'shreecem': 'SHREECEM',
    'spicejet': 'SPICEJET', 'spicejet limited': 'SPICEJET',
    'diagnostic robotic': 'SRL', 'srl': 'SRL',
    'shriram transport': 'SRTRANSFIN', 'srtransfin': 'SRTRANSFIN', 'shriram': 'SRTRANSFIN',
    'star india': 'STAR', 'star': 'STAR',
    'sun pharmaceutical': 'SUNPHARMA', 'sunpharma': 'SUNPHARMA', 'sun pharma': 'SUNPHARMA',
    'swiggy': 'SWIGGY', 'swiggy limited': 'SWIGGY',
    'tata communications': 'TATACOMM', 'tatacomm': 'TATACOMM',
    'tata consumer products': 'TATACONSUM', 'tataconsum': 'TATACONSUM', 'tata tea': 'TATACONSUM',
    'tata motors': 'TATAMOTORS', 'tatamotors': 'TATAMOTORS', 'tata motor': 'TATAMOTORS',
    'tata power': 'TATAPOWER', 'tatapower': 'TATAPOWER',
    'tata steel': 'TATASTEEL', 'tatasteel': 'TATASTEEL',
    'transport corporation': 'TCIEXP', 'tciexp': 'TCIEXP', 'tci': 'TCIEXP',
    'tata consultancy services': 'TCS', 'tcs': 'TCS', 'tata consultancy': 'TCS',
    'tech mahindra': 'TECHM', 'techm': 'TECHM', 'tech m': 'TECHM',
    'thyrocare technologies': 'THYROCARE', 'thyrocare': 'THYROCARE',
    'tips industries': 'TIPS', 'tips': 'TIPS',
    'trent': 'TRENT', 'trent limited': 'TRENT', 'westside': 'TRENT',
    'trident': 'TRIDENT', 'trident limited': 'TRIDENT',
    'tvs motor': 'TVSMOTOR', 'tvsmotor': 'TVSMOTOR', 'tvs': 'TVSMOTOR',
    'united breweries': 'UBL', 'ubl': 'UBL', 'kingfisher': 'UBL',
    'ujjivan small finance bank': 'UJJIVANSFB', 'ujjivansfb': 'UJJIVANSFB', 'ujjivan': 'UJJIVANSFB',
    'ultratech cement': 'ULTRACEMCO', 'ultracemco': 'ULTRACEMCO', 'ultratech': 'ULTRACEMCO',
    'unacademy': 'UNACADEMY', 'unacademy group': 'UNACADEMY',
    'union bank': 'UNIONBANK', 'unionbank': 'UNIONBANK',
    'varun beverages': 'VBL', 'vbl': 'VBL', 'pepsi': 'VBL',
    'vedanta': 'VEDL', 'vedl': 'VEDL', 'vedanta limited': 'VEDL',
    'v mart retail': 'VMART', 'vmart': 'VMART',
    'voltas': 'VOLTAS', 'voltas limited': 'VOLTAS',
    'welspun india': 'WELSPUNIND', 'welspunind': 'WELSPUNIND', 'welspun': 'WELSPUNIND',
    'westlife development': 'WESTLIFE', 'westlife': 'WESTLIFE', 'mcdonalds': 'WESTLIFE',
    'whirlpool of india': 'WHIRLPOOL', 'whirlpool': 'WHIRLPOOL',
    'wipro': 'WIPRO', 'wipro limited': 'WIPRO',
    'yes bank': 'YESBANK', 'yesbank': 'YESBANK',
    'zee entertainment': 'ZEEL', 'zeel': 'ZEEL', 'zee': 'ZEEL',
    'zomato': 'ZOMATO', 'zomato limited': 'ZOMATO'
  };

  /**
   * Classify user query intent to determine response type
   */
  static classifyQueryIntent(query: string): 'buy_sell_recommendation' | 'general_analysis' | 'price_info' | 'ipo_info' {
    const lowerQuery = query.toLowerCase().trim();
    
    // Check for IPO-related queries first (highest priority)
    const hasIpoIntent = this.IPO_PATTERNS.some(pattern => 
      lowerQuery.includes(pattern)
    );
    
    if (hasIpoIntent) {
      console.log(`🚀 Detected IPO query: "${query}"`);
      return 'ipo_info';
    }
    
    // Check for buy/sell/investment recommendation intent with specific patterns
    const hasBuySellIntent = this.BUY_SELL_PATTERNS.some(pattern => 
      lowerQuery.includes(pattern)
    );
    
    if (hasBuySellIntent) {
      console.log(`🎯 Detected BUY/SELL recommendation query: "${query}"`);
      return 'buy_sell_recommendation';
    }
    
    // Check for general analysis intent with specific patterns
    const hasAnalysisIntent = this.ANALYSIS_PATTERNS.some(pattern => 
      lowerQuery.includes(pattern)
    );
    
    if (hasAnalysisIntent) {
      console.log(`📊 Detected GENERAL ANALYSIS query: "${query}"`);
      return 'general_analysis';
    }
    
    // Check for simple price queries
    const priceKeywords = ['price', 'rate', 'value', 'current', 'today', 'live', 'quote'];
    const hasPriceIntent = priceKeywords.some(keyword => lowerQuery.includes(keyword));
    
    if (hasPriceIntent) {
      console.log(`💰 Detected PRICE INFO query: "${query}"`);
      return 'price_info';
    }
    
    // Default to general analysis for other stock-related queries
    console.log(`📊 Defaulting to GENERAL ANALYSIS for: "${query}"`);
    return 'general_analysis';
  }

  /**
   * Enhanced intelligent stock symbol extraction using Excel-based comprehensive database
   */
  static parseStockSymbol(query: string): string | null {
    console.log(`🔍 Using multi-layered stock detection for: "${query}"`);
    
    // Primary search: Excel-based service
    let symbol = ExcelBasedStockAnalysisService.parseStockSymbol(query);
    
    if (symbol) {
      const company = ExcelBasedStockAnalysisService.getCompanyBySymbol(symbol);
      console.log(`✅ Excel database match: ${company?.name} (${symbol})`);
      return symbol;
    }
    
    console.log(`⚠️ Primary search failed, trying alternative searches...`);
    
    // Secondary search: Try with variations and common misspellings
    const alternativeQueries = this.generateAlternativeQueries(query);
    for (const altQuery of alternativeQueries) {
      console.log(`🔄 Trying alternative: "${altQuery}"`);
      symbol = ExcelBasedStockAnalysisService.parseStockSymbol(altQuery);
      if (symbol) {
        const company = ExcelBasedStockAnalysisService.getCompanyBySymbol(symbol);
        console.log(`✅ Alternative match found: ${company?.name} (${symbol})`);
        return symbol;
      }
    }
    
    console.log(`❌ No match found in any search method for: "${query}"`);
    return null;
  }
  
  /**
   * Generate alternative search queries for better matching
   */
  private static generateAlternativeQueries(query: string): string[] {
    const alternatives: string[] = [];
    const normalizedQuery = query.toLowerCase();
    
    // Common variations and corrections
    const corrections = {
      'reddy labs': ['dr reddys laboratories', 'drreddys', 'dr reddy', 'reddys'],
      'vimta labs': ['vimta', 'vimta laboratories'], 
      'path labs': ['dr lal path labs', 'lal path labs'],
      'asian paints': ['asian paint'],
      'tata motors': ['tatamotors', 'tata motor'],
      'reliance': ['reliance industries', 'ril'],
      'hdfc': ['hdfc bank', 'hdfcbank'],
      'icici': ['icici bank', 'icicibank']
    };
    
    // Check for known corrections
    for (const [key, values] of Object.entries(corrections)) {
      if (normalizedQuery.includes(key)) {
        alternatives.push(...values);
      }
    }
    
    // Add variations with/without common suffixes
    const commonSuffixes = ['limited', 'ltd', 'pvt', 'private', 'company', 'corp', 'corporation'];
    const words = query.split(/\s+/);
    
    // Try without suffixes
    const withoutSuffixes = words.filter(word => 
      !commonSuffixes.includes(word.toLowerCase())
    ).join(' ');
    if (withoutSuffixes !== query) {
      alternatives.push(withoutSuffixes);
    }
    
    // Try with common variations
    alternatives.push(
      query.replace(/\s+/g, ''), // Remove spaces
      query.replace(/labs?/gi, 'laboratories'), // labs -> laboratories
      query.replace(/laboratories/gi, 'labs'), // laboratories -> labs  
      query.replace(/\b(dr|doctor)\s+/gi, ''), // Remove Dr/Doctor prefix
      query.replace(/\b(mr|mrs)\s+/gi, '') // Remove Mr/Mrs prefix
    );
    
    return Array.from(new Set(alternatives)); // Remove duplicates
  }

  /**
   * Find exact matches in the Indian stocks database
   */
  private static findExactStockMatch(query: string): string | null {
    // Check for exact company name matches
    for (const [companyName, symbol] of Object.entries(this.INDIAN_STOCKS)) {
      if (query.includes(companyName)) {
        return symbol;
      }
    }
    
    // Check for direct symbol matches (e.g., "TCS", "RELIANCE")
    const words = query.split(/\s+/);
    for (const word of words) {
      const upperWord = word.toUpperCase();
      if (Object.values(this.INDIAN_STOCKS).includes(upperWord)) {
        return upperWord;
      }
    }
    
    return null;
  }

  /**
   * Find fuzzy matches for partial company names
   */
  private static findFuzzyStockMatch(query: string): string | null {
    // Look for whole word matches only (minimum 4 characters to avoid false positives)
    for (const [companyName, symbol] of Object.entries(this.INDIAN_STOCKS)) {
      if (companyName.length >= 4) {
        // Check for whole word boundaries to avoid substring false matches
        const wordPattern = new RegExp(`\\b${companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (wordPattern.test(query)) {
          return symbol;
        }
      }
    }
    
    // Try word-by-word matching for multi-word company names
    const queryWords = query.toLowerCase().split(/\s+/);
    for (const [companyName, symbol] of Object.entries(this.INDIAN_STOCKS)) {
      const companyWords = companyName.toLowerCase().split(/\s+/);
      let matchCount = 0;
      
      for (const companyWord of companyWords) {
        // Only count exact word matches or very close matches (avoid substring matching)
        for (const queryWord of queryWords) {
          if (queryWord === companyWord || 
              (queryWord.length >= 4 && companyWord.length >= 4 && 
               (queryWord.startsWith(companyWord) || companyWord.startsWith(queryWord)))) {
            matchCount++;
            break; // Only count each company word once
          }
        }
      }
      
      // Require at least 2 matching words for multi-word companies, or all words for short companies
      const requiredMatches = companyWords.length >= 2 ? 2 : companyWords.length;
      if (matchCount >= requiredMatches) {
        return symbol;
      }
    }
    
    return null;
  }

  /**
   * Extract company names from query using intelligent patterns
   */
  private static extractCompanyNames(query: string): string[] {
    const words = query.split(/\s+/);
    const potentialNames: string[] = [];
    
    // Remove common stop words and stock keywords
    const stopWords = new Set([
      'i', 'should', 'buy', 'sell', 'invest', 'stock', 'share', 'shares', 'equity', 'now', 'today',
      'analysis', 'recommendation', 'price', 'target', 'good', 'bad', 'investment', 'the', 'a', 'an',
      'is', 'are', 'was', 'were', 'what', 'when', 'where', 'why', 'how', 'about', 'for', 'on', 'in',
      'can', 'could', 'will', 'would', 'shall', 'may', 'might', 'do', 'does', 'did', 'have', 'has', 'had',
      'be', 'been', 'being', 'to', 'at', 'by', 'from', 'with', 'into', 'during', 'before', 'after',
      'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once'
    ]);
    
    // Extract meaningful words that could be company names
    const meaningfulWords = words.filter(word => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      return cleanWord.length > 2 && !stopWords.has(cleanWord) && !this.STOCK_KEYWORDS.includes(cleanWord);
    });
    
    console.log(`📝 Meaningful words found: ${meaningfulWords.join(', ')}`);
    
    // Try different combinations
    for (let i = 0; i < meaningfulWords.length; i++) {
      // Single word company names
      const singleWord = meaningfulWords[i].replace(/[^\w]/g, '').toUpperCase();
      if (singleWord.length >= 3) {
        potentialNames.push(singleWord);
      }
      
      // Two word combinations
      if (i < meaningfulWords.length - 1) {
        const twoWords = (meaningfulWords[i] + meaningfulWords[i + 1]).replace(/[^\w]/g, '').toUpperCase();
        if (twoWords.length >= 4) {
          potentialNames.push(twoWords);
        }
      }
      
      // Three word combinations for companies like "Tata Consultancy Services"
      if (i < meaningfulWords.length - 2) {
        const threeWords = (meaningfulWords[i] + meaningfulWords[i + 1] + meaningfulWords[i + 2]).replace(/[^\w]/g, '').toUpperCase();
        if (threeWords.length >= 6) {
          potentialNames.push(threeWords);
        }
      }
    }
    
    // Also look for existing uppercase patterns (NSE symbols)
    const upperCaseMatches = query.match(/\b[A-Z]{2,15}\b/g);
    if (upperCaseMatches) {
      potentialNames.push(...upperCaseMatches);
    }
    
    // Remove duplicates and return
    return Array.from(new Set(potentialNames));
  }

  /**
   * Enhanced stock data fetching with multiple data sources and web scraping
   */
  static async fetchStockData(symbol: string, companyName?: string): Promise<StockAnalysisData | null> {
    console.log(`📊 FAST stock data fetching for: ${symbol} (${companyName || 'Unknown'})`);
    
    // SPEED OPTIMIZATION: Try all sources in parallel with aggressive timeouts
    console.log(`⚡ PARALLEL approach: Trying all sources simultaneously with 5s timeout...`);
    
    try {
      // Start all methods in parallel with race condition
      const racePromises = [
        this.tryApiSourcesWithTimeout(symbol, 2000), // Reduced to 2 second timeout
        WebScrapingService.vercelEnhancedSearch(symbol, companyName || symbol), // Skip comprehensive scraping
        this.createBasicFallbackData(symbol, companyName || symbol) // Always available fallback
      ];
      
      // Use Promise.allSettled to get fastest successful result
      const results = await Promise.allSettled(racePromises);
      
      // Return first successful result with actual data
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const value = result.value as any;
          
          // More flexible data validation - accept any non-zero numeric data
          const hasPrice = (value.currentPrice && value.currentPrice > 0) || 
                          (value.current_price && value.current_price > 0) ||
                          (value.price && value.price > 0) ||
                          (value.ltp && value.ltp > 0);
          
          if (hasPrice) {
            // Handle different data formats
            if ('current_price' in value || 'price' in value) {
              const price = value.current_price || value.price;
              console.log(`✅ FAST SUCCESS: Web scraping data at ₹${price}`);
              return this.mapScrapedDataToAnalysisData(value);
            } else {
              const price = value.currentPrice || value.ltp;
              console.log(`✅ FAST SUCCESS: API data at ₹${price}`);
              return value as StockAnalysisData;
            }
          } else {
            // Even without price, if we have company data, use it and try to get price later
            if (value.companyName || value.name || value.company_name) {
              console.log(`✅ FAST SUCCESS: Company data found for ${symbol} (price pending)`);
              if ('current_price' in value || 'price' in value) {
                return this.mapScrapedDataToAnalysisData(value);
              } else {
                return value as StockAnalysisData;
              }
            }
          }
        }
      }
      
      console.log(`⚠️ FAST FALLBACK: No quick data found, trying final web scraping attempt...`);
      
      // Try web scraping one more time with longer timeout as final attempt
      try {
        const webData = await WebScrapingService.vercelEnhancedSearch(symbol, companyName || symbol);
        if (webData && ((webData as any).current_price > 0 || (webData as any).price > 0)) {
          const price = (webData as any).current_price || (webData as any).price;
          console.log(`✅ FINAL FALLBACK SUCCESS: Web data at ₹${price}`);
          return this.mapScrapedDataToAnalysisData(webData);
        }
      } catch (error) {
        console.log(`⚠️ Final web scraping attempt failed for ${symbol}`);
      }
      
      console.log(`⚠️ Using basic fallback data for: ${symbol}`);
      return this.createBasicFallbackData(symbol, companyName || symbol);
      
    } catch (error) {
      console.error('❌ FAST fetch failed:', error);
      return this.createBasicFallbackData(symbol, companyName || symbol);
    }
  }

  /**
   * Try API sources with aggressive timeout for speed
   */
  private static async tryApiSourcesWithTimeout(symbol: string, timeoutMs: number): Promise<StockAnalysisData | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const apiData = await this.tryApiSources(symbol);
      clearTimeout(timeoutId);
      return apiData;
    } catch (error) {
      clearTimeout(timeoutId);
      console.log(`⚡ API sources timed out after ${timeoutMs}ms`);
      return null;
    }
  }

  /**
   * Create basic fallback data quickly
   */
  private static createBasicFallbackData(symbol: string, companyName: string): StockAnalysisData {
    return {
      symbol: symbol,
      companyName: companyName || symbol,
      currentPrice: 0, // Will be updated from web search if found
      change: 0,
      changePercent: 0,
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
      sector: 'General',
      industry: 'General',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Try multiple API sources (existing implementation)
   */
  private static async tryApiSources(symbol: string): Promise<StockAnalysisData | null> {
    // SPEED OPTIMIZATION: Only try most common formats with timeouts
    const symbolVariations = [
      symbol,             // Direct symbol (most common)
      `${symbol}.NS`,     // NSE format (second most common)
    ];
    
    for (const symbolVariation of symbolVariations) {
      try {
        console.log(`⚡ FAST API check for: ${symbolVariation}`);
        
        // Add timeout to API call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout per variation
        
        const stockData = await Promise.race([
          HybridStockApiService.getIndexData(symbolVariation),
          new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout')), 2000))
        ]) as any;
        
        clearTimeout(timeoutId);
        
        if (stockData && stockData.price > 0) {
          console.log(`✅ FAST API success for ${symbolVariation}: ₹${stockData.price}`);
          return this.mapToStockAnalysisData(stockData, symbol);
        }
      } catch (error) {
        console.log(`⚡ API ${symbolVariation} failed quickly:`, error instanceof Error ? error.message : error);
        continue; // Try next variation
      }
    }
    
    console.log(`⚡ No API data found quickly for: ${symbol}`);
    return null;
  }

  /**
   * Map scraped data to analysis format
   */
  private static mapScrapedDataToAnalysisData(scrapedData: ScrapedStockData): StockAnalysisData {
    return {
      symbol: scrapedData.symbol,
      companyName: scrapedData.company_name,
      currentPrice: scrapedData.current_price,
      change: (scrapedData.current_price * scrapedData.change_percent) / 100,
      changePercent: scrapedData.change_percent,
      dayHigh: scrapedData.day_high || 0,
      dayLow: scrapedData.day_low || 0,
      volume: scrapedData.volume || 0,
      sector: 'General', // Will be enhanced with web search data
      industry: 'General', // Will be enhanced with web search data
      lastUpdated: scrapedData.last_updated
    };
  }

  /**
   * Map stock API data to analysis format
   */
  private static mapToStockAnalysisData(stockData: any, symbol: string): StockAnalysisData {
    return {
      symbol: symbol,
      companyName: stockData.name || symbol,
      currentPrice: stockData.price || 0,
      change: stockData.change || 0,
      changePercent: stockData.changePercent || 0,
      dayHigh: stockData.dayHigh || 0,
      dayLow: stockData.dayLow || 0,
      volume: stockData.volume || 0,
      marketCap: stockData.marketCap,
      sector: stockData.sector || 'General', // Use API data if available
      industry: stockData.industry || 'General', // Use API data if available
      lastUpdated: stockData.lastUpdated || new Date().toISOString()
    };
  }

  /**
   * Perform web search for stock insights using Google Custom Search API
   */
  static async searchStockInsights(symbol: string, companyName: string): Promise<WebSearchResult[]> {
    console.log(`🌐 Starting web search for: ${companyName} (${symbol})`);
    
    // First check if Google API credentials are available
    const apiKey = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID;
    
    console.log(`🔑 API Key available: ${!!apiKey}`);
    console.log(`🔍 Search Engine ID available: ${!!searchEngineId}`);
    
    if (!apiKey || !searchEngineId) {
      console.error('❌ Google Search API credentials missing!');
      console.error('Missing:', { apiKey: !apiKey, searchEngineId: !searchEngineId });
      return this.getFallbackInsights(symbol, companyName);
    }
    
    try {
      console.log(`🔍 Performing Google search for ${companyName} (${symbol})`);
      
      // Add aggressive timeout to prevent long delays
      console.log(`📝 DEBUG: Starting Google search without timeout...`);
      const results = await GoogleSearchApiService.searchStockInsights(symbol, companyName, 5); // Limit to 5 results
      
      if (results.length > 0) {
        console.log(`✅ Found ${results.length} Google search results for ${symbol}`);
        console.log(`📝 DEBUG: Results being returned:`, results.map(r => ({ title: r.title, source: r.source })));
        return results;
      } else {
        console.warn(`⚠️ No Google search results found for ${symbol}, using fallback`);
        const fallbackResults = this.getFallbackInsights(symbol, companyName);
        console.log(`📝 DEBUG: Fallback results:`, fallbackResults.length);
        return fallbackResults;
      }
    } catch (error) {
      console.error('❌ Google search failed or timed out:', error);
      return this.getFallbackInsights(symbol, companyName);
    }
  }


  /**
   * Provide fallback insights when web search fails
   */
  private static getFallbackInsights(symbol: string, companyName: string): WebSearchResult[] {
    return [
      {
        title: `${companyName} Stock Analysis - Key Factors to Consider`,
        url: '#',
        snippet: 'Consider analyzing company fundamentals, recent quarterly results, industry trends, and market sentiment before making investment decisions.',
        source: 'Investment Guidelines',
        publishedDate: new Date().toISOString()
      },
      {
        title: `${symbol} Technical Analysis Points`,
        url: '#',
        snippet: 'Review price charts, moving averages, volume trends, and support/resistance levels for technical insights.',
        source: 'Technical Analysis',
        publishedDate: new Date().toISOString()
      },
      {
        title: `Sector Analysis for ${companyName}`,
        url: '#',
        snippet: 'Evaluate sector performance, peer comparison, and industry-specific factors affecting the stock.',
        source: 'Sector Research',
        publishedDate: new Date().toISOString()
      }
    ];
  }

  /**
   * Generate AI-powered recommendation using OpenAI with structured prompts
   */
  static async generateEnhancedRecommendation(
    stockData: StockAnalysisData,
    webInsights: WebSearchResult[],
    userQuery: string
  ): Promise<StockRecommendation> {
    console.log(`🧠 Generating AI-powered analysis for ${stockData.companyName} using ${webInsights.length} web insights...`);

    // First calculate base scores
    const webSentimentScore = this.analyzeWebSentiment(webInsights);
    const technicalScore = this.calculateTechnicalScore(stockData);
    const fundamentalScore = this.calculateFundamentalScore(stockData);
    const newsImpactScore = this.calculateNewsImpact(webInsights);
    
    console.log(`📊 Base scores - Technical: ${technicalScore}, Sentiment: ${webSentimentScore}, Fundamental: ${fundamentalScore}, News: ${newsImpactScore}`);

    // Try AI-powered analysis first
    const aiRecommendation = await this.generateAIRecommendation(stockData, webInsights, userQuery);
    if (aiRecommendation) {
      console.log(`✅ AI-powered recommendation generated for ${stockData.companyName}`);
      return aiRecommendation;
    }

    // Fallback to enhanced algorithmic analysis
    console.log(`🔄 Using enhanced algorithmic fallback for ${stockData.companyName}`);
    return this.generateAlgorithmicRecommendation(stockData, webInsights, {
      technicalScore,
      webSentimentScore,
      fundamentalScore,
      newsImpactScore
    });
  }

  /**
   * Generate AI recommendation using OpenAI with structured prompts
   */
  private static async generateAIRecommendation(
    stockData: StockAnalysisData,
    webInsights: WebSearchResult[],
    userQuery: string
  ): Promise<StockRecommendation | null> {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      if (!apiKey) {
        console.log('OpenAI API key not available for AI analysis');
        return null;
      }

      // Prepare structured data for AI
      const marketData = {
        symbol: stockData.symbol,
        companyName: stockData.companyName,
        currentPrice: stockData.currentPrice,
        changePercent: stockData.changePercent,
        dayHigh: stockData.dayHigh,
        dayLow: stockData.dayLow,
        volume: stockData.volume,
        sector: stockData.sector
      };

      const newsData = webInsights.slice(0, 5).map(insight => ({
        title: insight.title,
        snippet: insight.snippet,
        source: insight.source,
        date: insight.publishedDate
      }));

      const aiPrompt = `You are an expert Indian stock market analyst. Analyze the following stock data and provide an OBJECTIVE recommendation based ONLY on the stock's performance and market conditions, regardless of what the user is asking.

**STOCK DATA:**
${JSON.stringify(marketData, null, 2)}

**RECENT NEWS & ANALYSIS:**
${newsData.map(news => `- [${news.source}] ${news.title}: ${news.snippet}`).join('\n')}

**USER QUERY:** "${userQuery}"

**CRITICAL ANALYSIS GUIDELINES:**
1. IGNORE the user's question phrasing (buy/sell) - provide recommendation based ONLY on stock analysis
2. If stock is underperforming/declining/negative trends → Recommend SELL (even if user asks "should I buy")
3. If stock is performing well/growing/positive trends → Recommend BUY (even if user asks "should I sell") 
4. If stock is neutral/mixed signals → Recommend HOLD
5. Be objective and data-driven, not influenced by user's bias

**ANALYSIS REQUIREMENTS:**
1. Provide a clear BUY/SELL/HOLD recommendation based on stock performance
2. Give confidence level (0-100%)
3. Provide 4-6 key reasoning points explaining why
4. Suggest time horizon (SHORT_TERM/MEDIUM_TERM/LONG_TERM)
5. Calculate target price and stop loss if applicable

**RESPONSE FORMAT (JSON only):**
{
  "action": "BUY|SELL|HOLD",
  "confidence": 85,
  "reasoning": [
    "Technical analysis shows strong/weak momentum...",
    "Market sentiment indicates positive/negative outlook...", 
    "Fundamental factors suggest growth/decline...",
    "Recent news impact is positive/negative..."
  ],
  "timeHorizon": "MEDIUM_TERM",
  "targetPrice": 1250.50,
  "stopLoss": 1150.25,
  "analysis": "Brief overall analysis summary"
}

Consider Indian market conditions, NSE/BSE trading patterns, and sector-specific factors. Base your analysis OBJECTIVELY on actual data provided, not on user's question.`;

      // Add aggressive timeout for OpenAI API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Use faster mini model instead of full gpt-4o
          messages: [
            {
              role: 'system',
              content: 'You are an expert Indian stock market analyst. Respond only with valid JSON format as requested.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          max_tokens: 500, // Reduced from 1000 for faster response
          temperature: 0.1,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      if (aiResponse) {
        try {
          // Clean the AI response to handle markdown code blocks
          const cleanedResponse = aiResponse
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();
          
          const parsedResponse = JSON.parse(cleanedResponse);
          console.log(`🤖 AI recommendation parsed successfully for ${stockData.companyName}`);
          
          return {
            action: parsedResponse.action as 'BUY' | 'SELL' | 'HOLD',
            confidence: Math.min(95, Math.max(50, parsedResponse.confidence)),
            reasoning: parsedResponse.reasoning || ['AI analysis completed'],
            timeHorizon: parsedResponse.timeHorizon || 'MEDIUM_TERM',
            targetPrice: parsedResponse.targetPrice || undefined,
            stopLoss: parsedResponse.stopLoss || undefined
          };
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          return null;
        }
      }

      return null;

    } catch (error) {
      console.error('AI recommendation generation failed:', error);
      return null;
    }
  }

  /**
   * Enhanced algorithmic recommendation (fallback)
   */
  private static generateAlgorithmicRecommendation(
    stockData: StockAnalysisData,
    webInsights: WebSearchResult[],
    scores: { technicalScore: number; webSentimentScore: number; fundamentalScore: number; newsImpactScore: number }
  ): StockRecommendation {
    // Weighted scoring with emphasis on web insights
    const overallScore = (
      scores.technicalScore * 0.25 + 
      scores.webSentimentScore * 0.35 + 
      scores.fundamentalScore * 0.25 + 
      scores.newsImpactScore * 0.15
    );
    
    let action: 'BUY' | 'SELL' | 'HOLD';
    let confidence: number;
    let reasoning: string[] = [];
    
    // Determine action based on enhanced scoring
    if (overallScore >= 75) {
      action = 'BUY';
      confidence = Math.min(95, overallScore);
      reasoning = [
        `Strong buy signals from comprehensive analysis (Score: ${overallScore.toFixed(1)}/100)`,
        `Current market sentiment is positive based on recent news and analysis`,
        stockData.currentPrice > 0 ? `Technical indicators show favorable entry point at ₹${stockData.currentPrice}` : `Web research indicates favorable market conditions`,
        `Financial experts show positive outlook based on web research`
      ];
    } else if (overallScore <= 35) {
      action = 'SELL';
      confidence = Math.min(95, 100 - overallScore);
      reasoning = [
        `Analysis suggests caution with current weak signals (Score: ${overallScore.toFixed(1)}/100)`,
        `Market sentiment appears negative based on recent developments`,
        stockData.currentPrice > 0 ? `Technical indicators show potential downside risk` : `Web research indicates market concerns`,
        `Financial analysts express caution based on recent news`
      ];
    } else {
      action = 'HOLD';
      confidence = 60 + Math.abs(overallScore - 50);
      reasoning = [
        `Mixed signals suggest a wait-and-watch approach (Score: ${overallScore.toFixed(1)}/100)`,
        `Market sentiment is neutral with conflicting opinions`,
        stockData.currentPrice > 0 ? `Current price levels appear fairly valued` : `Insufficient data for clear directional signals`,
        `Recommend monitoring for clearer market direction`
      ];
    }
    
    // Add specific insights from web search
    if (webInsights.length > 0) {
      const recentNews = webInsights.filter(insight => {
        if (!insight.publishedDate) return false;
        const daysSince = (Date.now() - new Date(insight.publishedDate).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince < 7;
      });
      
      if (recentNews.length > 0) {
        reasoning.push(`${recentNews.length} recent news articles analyzed for current market sentiment`);
      }
      
      // Add key insights from search results
      const keyTopics = this.extractKeyTopics(webInsights);
      if (keyTopics.length > 0) {
        reasoning.push(`Key market themes: ${keyTopics.join(', ')}`);
      }
    }
    
    // Add stock-specific insights
    if (stockData.changePercent > 5) {
      reasoning.push(`Stock showing strong momentum with +${stockData.changePercent.toFixed(2)}% gain`);
    } else if (stockData.changePercent < -5) {
      reasoning.push(`Stock under pressure with ${stockData.changePercent.toFixed(2)}% decline`);
    }
    
    if (stockData.volume > 0) {
      reasoning.push(`Active trading interest with significant volume`);
    }
    
    return {
      action,
      confidence,
      reasoning,
      timeHorizon: this.determineTimeHorizon(stockData, overallScore),
      targetPrice: this.calculateTargetPrice(stockData, action),
      stopLoss: this.calculateStopLoss(stockData, action)
    };
  }

  /**
   * Original recommendation function (kept for backward compatibility)
   */
  static async generateRecommendation(
    stockData: StockAnalysisData,
    webInsights: WebSearchResult[]
  ): Promise<StockRecommendation> {
    try {
      // Analyze various factors to generate recommendation
      const technicalScore = this.calculateTechnicalScore(stockData);
      const sentimentScore = this.analyzeSentiment(webInsights);
      const fundamentalScore = this.calculateFundamentalScore(stockData);
      
      const overallScore = (technicalScore + sentimentScore + fundamentalScore) / 3;
      
      let action: 'BUY' | 'SELL' | 'HOLD';
      let confidence: number;
      let reasoning: string[] = [];
      
      if (overallScore >= 70) {
        action = 'BUY';
        confidence = Math.min(95, overallScore);
        reasoning = [
          'Strong technical indicators showing upward momentum',
          'Positive market sentiment from recent news and analysis',
          'Fundamental metrics appear favorable for growth'
        ];
      } else if (overallScore <= 30) {
        action = 'SELL';
        confidence = Math.min(95, 100 - overallScore);
        reasoning = [
          'Technical indicators suggest downward pressure',
          'Market sentiment appears cautious or negative',
          'Fundamental concerns may impact future performance'
        ];
      } else {
        action = 'HOLD';
        confidence = 60 + Math.abs(overallScore - 50);
        reasoning = [
          'Mixed signals from technical and fundamental analysis',
          'Current price levels may be fairly valued',
          'Consider waiting for clearer market direction'
        ];
      }
      
      // Add specific reasoning based on stock data
      if (stockData.changePercent > 5) {
        reasoning.push('Stock has shown strong recent gains (+' + stockData.changePercent.toFixed(2) + '%)');
      } else if (stockData.changePercent < -5) {
        reasoning.push('Stock has declined recently (' + stockData.changePercent.toFixed(2) + '%)');
      }
      
      if (stockData.volume > 0) {
        reasoning.push('Trading volume indicates active market interest');
      }
      
      return {
        action,
        confidence,
        reasoning,
        timeHorizon: this.determineTimeHorizon(stockData, overallScore),
        targetPrice: this.calculateTargetPrice(stockData, action),
        stopLoss: this.calculateStopLoss(stockData, action)
      };
    } catch (error) {
      console.error('Error generating recommendation:', error);
      
      // Fallback recommendation
      return {
        action: 'HOLD',
        confidence: 50,
        reasoning: [
          'Unable to perform complete analysis due to limited data',
          'Recommend consulting with financial advisor',
          'Consider your risk tolerance and investment goals'
        ],
        timeHorizon: 'MEDIUM_TERM'
      };
    }
  }

  /**
   * Calculate technical analysis score (0-100)
   */
  private static calculateTechnicalScore(stockData: StockAnalysisData): number {
    let score = 50; // Neutral starting point
    
    // If no real-time data available, return neutral score
    if (stockData.currentPrice === 0) {
      return 50;
    }
    
    // Price momentum
    if (stockData.changePercent > 2) score += 20;
    else if (stockData.changePercent > 0) score += 10;
    else if (stockData.changePercent < -2) score -= 20;
    else if (stockData.changePercent < 0) score -= 10;
    
    // Price position relative to day range
    const dayRange = stockData.dayHigh - stockData.dayLow;
    if (dayRange > 0) {
      const pricePosition = (stockData.currentPrice - stockData.dayLow) / dayRange;
      if (pricePosition > 0.8) score += 15;
      else if (pricePosition > 0.6) score += 10;
      else if (pricePosition < 0.2) score -= 15;
      else if (pricePosition < 0.4) score -= 10;
    }
    
    // Volume analysis (higher volume generally indicates stronger moves)
    if (stockData.volume > 1000000) score += 10;
    else if (stockData.volume > 500000) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Enhanced web sentiment analysis using comprehensive keyword analysis
   */
  private static analyzeWebSentiment(insights: WebSearchResult[]): number {
    if (insights.length === 0) return 50; // Neutral if no insights
    
    let score = 50; // Neutral starting point
    
    const strongPositiveKeywords = [
      'strong buy', 'outperform', 'upgrade', 'target raised', 'bullish', 'positive outlook',
      'growth potential', 'strong results', 'beat estimates', 'expansion', 'record high'
    ];
    
    const positiveKeywords = [
      'buy', 'positive', 'growth', 'strong', 'good', 'increase', 'gain', 'profit',
      'revenue growth', 'market share', 'competitive advantage', 'dividend'
    ];
    
    const strongNegativeKeywords = [
      'strong sell', 'underperform', 'downgrade', 'target cut', 'bearish', 'negative outlook',
      'profit warning', 'loss', 'debt concerns', 'regulatory issues', 'scandal'
    ];
    
    const negativeKeywords = [
      'sell', 'negative', 'decline', 'weak', 'concern', 'risk', 'fall', 'drop',
      'competition', 'pressure', 'margin compression', 'volatility'
    ];
    
    insights.forEach(insight => {
      const text = (insight.title + ' ' + insight.snippet).toLowerCase();
      
      // Strong signals get higher weight
      strongPositiveKeywords.forEach(keyword => {
        if (text.includes(keyword)) score += 8;
      });
      
      strongNegativeKeywords.forEach(keyword => {
        if (text.includes(keyword)) score -= 8;
      });
      
      // Regular signals
      positiveKeywords.forEach(keyword => {
        if (text.includes(keyword)) score += 3;
      });
      
      negativeKeywords.forEach(keyword => {
        if (text.includes(keyword)) score -= 3;
      });
      
      // Recency bonus - more recent articles get higher weight
      if (insight.publishedDate) {
        const daysSince = (Date.now() - new Date(insight.publishedDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 1) score += 2; // Today's news
        if (daysSince < 7) score += 1; // This week's news
      }
    });
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate news impact score based on source credibility and recency
   */
  private static calculateNewsImpact(insights: WebSearchResult[]): number {
    let score = 50; // Neutral starting point
    
    const trustedSources = [
      'moneycontrol', 'economic times', 'livemint', 'business standard',
      'financial express', 'bloomberg', 'reuters', 'cnbc'
    ];
    
    insights.forEach(insight => {
      let articleWeight = 1;
      
      // Higher weight for trusted sources
      trustedSources.forEach(source => {
        if (insight.source.toLowerCase().includes(source)) {
          articleWeight = 2;
        }
      });
      
      // Recency factor
      if (insight.publishedDate) {
        const daysSince = (Date.now() - new Date(insight.publishedDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 1) articleWeight *= 2; // Very recent
        if (daysSince < 7) articleWeight *= 1.5; // Recent
      }
      
      // Content analysis
      const text = (insight.title + ' ' + insight.snippet).toLowerCase();
      
      if (text.includes('analyst') || text.includes('recommendation')) {
        score += 5 * articleWeight;
      }
      
      if (text.includes('earnings') || text.includes('results')) {
        score += 4 * articleWeight;
      }
      
      if (text.includes('target price') || text.includes('price target')) {
        score += 6 * articleWeight;
      }
    });
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Extract key topics from web insights
   */
  private static extractKeyTopics(insights: WebSearchResult[]): string[] {
    const topics = new Set<string>();
    
    const topicKeywords = {
      'earnings': ['earnings', 'results', 'quarterly', 'annual'],
      'analyst recommendation': ['analyst', 'recommendation', 'rating', 'target'],
      'expansion': ['expansion', 'growth', 'new', 'launch'],
      'regulatory': ['regulatory', 'government', 'policy', 'approval'],
      'competition': ['competition', 'competitor', 'market share'],
      'financial performance': ['revenue', 'profit', 'margin', 'debt']
    };
    
    insights.forEach(insight => {
      const text = (insight.title + ' ' + insight.snippet).toLowerCase();
      
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => text.includes(keyword))) {
          topics.add(topic);
        }
      });
    });
    
    return Array.from(topics).slice(0, 3); // Return top 3 topics
  }

  /**
   * Analyze sentiment from web insights
   */
  private static analyzeSentiment(insights: WebSearchResult[]): number {
    let score = 50; // Neutral starting point
    
    const positiveKeywords = [
      'bullish', 'positive', 'growth', 'strong', 'outperform', 'upgrade', 'buy',
      'target', 'potential', 'recovery', 'momentum', 'breakout', 'support'
    ];
    
    const negativeKeywords = [
      'bearish', 'negative', 'decline', 'weak', 'underperform', 'downgrade', 'sell',
      'concern', 'risk', 'pressure', 'resistance', 'correction', 'caution'
    ];
    
    insights.forEach(insight => {
      const text = (insight.title + ' ' + insight.snippet).toLowerCase();
      
      positiveKeywords.forEach(keyword => {
        if (text.includes(keyword)) score += 3;
      });
      
      negativeKeywords.forEach(keyword => {
        if (text.includes(keyword)) score -= 3;
      });
    });
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate fundamental analysis score
   */
  private static calculateFundamentalScore(stockData: StockAnalysisData): number {
    let score = 50; // Neutral starting point
    
    // Sector-based adjustments
    const growthSectors = ['Information Technology', 'Healthcare', 'Consumer Discretionary'];
    const defensiveSectors = ['Consumer Staples', 'Utilities', 'Telecommunications'];
    
    if (growthSectors.includes(stockData.sector)) {
      score += 10;
    } else if (defensiveSectors.includes(stockData.sector)) {
      score += 5;
    }
    
    // Market cap considerations (assuming larger companies are more stable)
    if (stockData.marketCap && stockData.marketCap > 1000000000) { // > 1000 Cr
      score += 10;
    } else if (stockData.marketCap && stockData.marketCap > 500000000) { // > 500 Cr
      score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine investment time horizon
   */
  private static determineTimeHorizon(stockData: StockAnalysisData, score: number): 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' {
    if (Math.abs(stockData.changePercent) > 3 && score > 70) {
      return 'SHORT_TERM'; // High volatility with strong signal
    } else if (score > 60 || score < 40) {
      return 'MEDIUM_TERM'; // Clear directional bias
    } else {
      return 'LONG_TERM'; // Unclear signals, longer horizon recommended
    }
  }

  /**
   * Calculate target price based on recommendation
   */
  private static calculateTargetPrice(stockData: StockAnalysisData, action: 'BUY' | 'SELL' | 'HOLD'): number | undefined {
    if (action === 'BUY') {
      return stockData.currentPrice * 1.15; // 15% upside target
    } else if (action === 'SELL') {
      return stockData.currentPrice * 0.90; // 10% downside
    }
    return undefined; // No target for HOLD
  }

  /**
   * Calculate stop loss based on recommendation
   */
  private static calculateStopLoss(stockData: StockAnalysisData, action: 'BUY' | 'SELL' | 'HOLD'): number | undefined {
    if (action === 'BUY') {
      return stockData.currentPrice * 0.95; // 5% stop loss
    } else if (action === 'SELL') {
      return stockData.currentPrice * 1.05; // 5% stop loss on short
    }
    return undefined; // No stop loss for HOLD
  }

  // Removed hardcoded sector/industry mappings - now using dynamic data from APIs

  /**
   * Quick stock info for simple price queries (optimized for speed)
   */
  static async getQuickStockInfo(symbol: string, companyName: string, userQuery: string): Promise<StockAnalysisResult | null> {
    console.log(`⚡ Quick stock info mode for: ${symbol}`);
    
    try {
      // Get basic stock data with shorter timeout (2s instead of 5s)
      const stockData = await Promise.race([
        this.fetchStockDataFast(symbol, companyName),
        new Promise<StockAnalysisData | null>((_, reject) => 
          setTimeout(() => reject(new Error('Quick fetch timeout')), 2000)
        )
      ]);

      // If no stock data, use fallback
      const finalStockData = stockData || this.createBasicFallbackData(symbol, companyName);

      // Minimal web insights (just 3 results for speed)
      const webInsights = await this.searchStockInsightsQuick(symbol, companyName);

      return {
        stockData: finalStockData,
        webInsights: webInsights.slice(0, 3), // Limit to 3 for speed
        recommendation: {
          action: 'HOLD',
          confidence: 0, // No recommendation for price queries
          reasoning: ['Price information provided without investment recommendation'],
          timeHorizon: 'SHORT_TERM'
        },
        analysisDate: new Date().toISOString(),
        disclaimers: [
          'This is basic price information for educational purposes only.',
          'Not investment advice. Consult qualified financial advisors.'
        ]
      };
    } catch (error) {
      console.log(`⚠️ Quick mode failed, falling back to regular analysis`);
      // Fallback to regular analysis if quick mode fails
      return null;
    }
  }

  /**
   * Ultra-fast stock data fetch for quick queries (1s timeout)
   */
  static async fetchStockDataFast(symbol: string, companyName?: string): Promise<StockAnalysisData | null> {
    console.log(`⚡ ULTRA-FAST stock data fetching for: ${symbol}`);
    
    try {
      // Try only API sources with 1s timeout (skip web scraping for speed)
      const result = await this.tryApiSourcesWithTimeout(symbol, 1000);
      
      return result || this.createBasicFallbackData(symbol, companyName || symbol);
    } catch (error) {
      console.log(`⚠️ Ultra-fast fetch failed, using fallback data`);
      return this.createBasicFallbackData(symbol, companyName || symbol);
    }
  }

  /**
   * Quick web search for basic insights (3 results max)
   */
  static async searchStockInsightsQuick(symbol: string, companyName: string): Promise<WebSearchResult[]> {
    console.log(`⚡ Quick web search for: ${symbol}`);
    
    try {
      // Reduced search with timeout
      const results = await Promise.race([
        GoogleSearchApiService.searchStockInsights(symbol, companyName, 3), // Only 3 results
        new Promise<WebSearchResult[]>((_, reject) => 
          setTimeout(() => reject(new Error('Quick search timeout')), 1500) // 1.5s timeout
        )
      ]);
      
      return results.slice(0, 3); // Ensure max 3 results
    } catch (error) {
      console.log(`⚠️ Quick search failed, returning empty results`);
      return [];
    }
  }

  /**
   * Handle IPO-related queries with intelligent web search
   */
  static async handleIpoQuery(symbol: string, companyName: string, userQuery: string): Promise<StockAnalysisResult | null> {
    console.log(`🚀 IPO query mode for: ${companyName} (${symbol})`);
    
    try {
      // For IPO queries, focus on web search for IPO information
      const ipoSearchTerms = [
        `${companyName} IPO details launch date price`,
        `${companyName} initial public offering 2024 2025`,
        `${companyName} stock listing NSE BSE IPO news`
      ];
      
      // Search for IPO-specific information
      let webInsights: WebSearchResult[] = [];
      
      for (const searchTerm of ipoSearchTerms) {
        try {
          const results = await GoogleSearchApiService.searchStockInsights(symbol, searchTerm, 5);
          webInsights.push(...results);
          if (webInsights.length >= 8) break; // Limit total results
        } catch (error) {
          console.log(`⚠️ IPO search failed for: ${searchTerm}`);
        }
      }

      // Create fallback stock data for IPO (unlisted company)
      const fallbackData: StockAnalysisData = {
        symbol: symbol,
        companyName: companyName,
        currentPrice: 0, // Not listed yet
        change: 0,
        changePercent: 0,
        dayHigh: 0,
        dayLow: 0,
        volume: 0,
        sector: 'IPO',
        industry: 'Initial Public Offering',
        lastUpdated: new Date().toISOString()
      };

      return {
        stockData: fallbackData,
        webInsights: webInsights.slice(0, 8), // Limit to 8 results
        recommendation: {
          action: 'HOLD',
          confidence: 0, // No recommendation for IPO queries
          reasoning: ['IPO information provided - company not yet listed for trading'],
          timeHorizon: 'LONG_TERM'
        },
        analysisDate: new Date().toISOString(),
        disclaimers: [
          'This is IPO information for educational purposes only.',
          'IPO investments carry high risk. Research thoroughly before applying.',
          'Consult qualified financial advisors before making IPO investment decisions.'
        ]
      };
    } catch (error) {
      console.log(`⚠️ IPO query failed, falling back to regular analysis`);
      return null;
    }
  }

  /**
   * Create fast fallback recommendation when AI processing times out
   */
  private static createFallbackRecommendation(stockData: StockAnalysisData, webInsights: WebSearchResult[]): StockRecommendation {
    console.log(`⚡ Creating fast fallback recommendation for ${stockData.symbol}`);
    
    // Quick scoring based on available data
    const hasPrice = stockData.currentPrice > 0;
    const hasNewsInsights = webInsights.length > 2;
    const confidence = hasPrice && hasNewsInsights ? 65 : 45;
    
    return {
      action: 'HOLD',
      confidence: confidence,
      reasoning: [
        hasPrice ? `Current price: ₹${stockData.currentPrice}` : 'Limited price data available',
        hasNewsInsights ? `${webInsights.length} news insights analyzed` : 'Limited news analysis',
        'Quick analysis completed - consult financial advisor for detailed recommendations'
      ],
      timeHorizon: 'MEDIUM_TERM'
    };
  }

  /**
   * Complete stock analysis pipeline with enhanced web search integration
   */
  static async analyzeStock(userQuery: string): Promise<StockAnalysisResult | null> {
    // Add 7-minute timeout to prevent infinite hanging while allowing analysis to complete
    return Promise.race([
      this.performStockAnalysis(userQuery),
      new Promise<StockAnalysisResult | null>((_, reject) => 
        setTimeout(() => reject(new Error('Stock analysis timeout - please try again')), 420000) // 7 minutes
      )
    ]).catch((error) => {
      console.error('❌ Stock analysis timed out or failed:', error);
      return null;
    });
  }

  /**
   * Internal method to perform stock analysis without timeout wrapper
   */
  private static async performStockAnalysis(userQuery: string): Promise<StockAnalysisResult | null> {
    try {
      // Parse stock symbol from query
      const symbol = this.parseStockSymbol(userQuery);
      if (!symbol) {
        return null;
      }

      // Classify query intent to optimize response
      const queryIntent = this.classifyQueryIntent(userQuery);
      
      console.log(`🔍 Starting analysis for: ${symbol} (Intent: ${queryIntent})`);
      console.log(`📝 User query: "${userQuery}"`);

      // Extract company name from user query for better data fetching
      const extractedCompanyName = this.extractCompanyNameFromQuery(userQuery, symbol);

      // Optimize based on query intent
      if (queryIntent === 'price_info') {
        // For simple price queries, get quick data only
        return await this.getQuickStockInfo(symbol, extractedCompanyName, userQuery);
      }
      
      if (queryIntent === 'ipo_info') {
        // For IPO queries, do intelligent web search instead of stock data
        return await this.handleIpoQuery(symbol, extractedCompanyName, userQuery);
      }

      // Step 1: Start both stock data fetching and web search in parallel for speed
      console.log(`📊 Step 1: Starting parallel data fetching for ${symbol}...`);
      
      
      // Run API data fetching and web search in parallel with overall timeout
      const dataPromises = Promise.allSettled([
        this.fetchStockData(symbol, extractedCompanyName),
        this.searchStockInsights(symbol, extractedCompanyName)
      ]);
      
      // Remove timeout temporarily to debug
      console.log(`📝 DEBUG: Waiting for data promises to settle...`);
      const [stockDataResult, webInsightsResult] = await dataPromises;
      console.log(`📝 DEBUG: Final results status - stock: ${stockDataResult.status}, web: ${webInsightsResult.status}`);
      
      // Process stock data result
      let stockData: StockAnalysisData;
      if (stockDataResult.status === 'fulfilled' && stockDataResult.value) {
        stockData = stockDataResult.value;
        console.log(`✅ Enhanced stock data retrieved: ${stockData.companyName} at ₹${stockData.currentPrice}`);
      } else {
        console.log(`⚠️ No stock data found for ${symbol}, creating fallback entry for web search`);
        stockData = this.createFallbackStockData(symbol, extractedCompanyName);
      }
      
      // Process web insights result
      const webInsights = webInsightsResult.status === 'fulfilled' ? webInsightsResult.value : [];
      console.log(`🌐 Web search completed: ${webInsights.length} insights found`);
      console.log(`📝 DEBUG: webInsightsResult status:`, webInsightsResult.status);
      if (webInsightsResult.status === 'rejected') {
        console.log(`📝 DEBUG: webInsightsResult error:`, webInsightsResult.reason);
      } else {
        console.log(`📝 DEBUG: webInsightsResult value:`, webInsightsResult.value?.length, 'insights');
      }
      console.log(`✅ Found ${webInsights.length} web insights from financial sources`);
      
      // Continue with the analysis flow
      console.log(`📝 DEBUG: Continuing to step 3 - recommendation generation...`);

      // SPEED OPTIMIZATION: Skip expensive price extraction from web search
      if (stockData.currentPrice === 0 && webInsights.length > 0) {
        console.log(`⚡ SPEED: Skipping price extraction to save time - proceeding with web-only analysis...`);
        // Use web insights directly for analysis without price extraction
      }

      // Step 3: Generate recommendation only for buy/sell queries
      let recommendation: StockRecommendation;
      
      if (queryIntent === 'buy_sell_recommendation') {
        console.log(`🧠 Step 3: Generating recommendation using ${stockData.currentPrice > 0 ? 'extracted' : 'web-only'} data and insights...`);
        
        // Add timeout for recommendation generation
        try {
          console.log(`📝 DEBUG: Generating recommendation without timeout...`);
          recommendation = await this.generateEnhancedRecommendation(stockData, webInsights, userQuery);
          console.log(`✅ Generated ${recommendation.action} recommendation with ${recommendation.confidence}% confidence`);
        } catch (error) {
          console.log(`⚠️ Recommendation generation timed out, using fallback`);
          recommendation = this.createFallbackRecommendation(stockData, webInsights);
        }
      } else {
        // For analysis queries, provide neutral HOLD with analysis focus
        console.log(`📊 Step 3: Skipping recommendation for analysis query, providing neutral analysis...`);
        recommendation = {
          action: 'HOLD',
          confidence: 0, // 0 confidence indicates no recommendation requested
          reasoning: ['Analysis provided without investment recommendation'],
          timeHorizon: 'MEDIUM_TERM'
        };
      }

      const analysisResult = {
        stockData,
        webInsights,
        recommendation,
        analysisDate: new Date().toISOString(),
        disclaimers: [
          'This analysis is based on web research and available data for educational purposes only.',
          'Not financial advice - consult qualified financial advisors before investing.',
          'Stock markets are volatile and past performance doesn\'t guarantee future results.',
          'Consider your risk tolerance, investment objectives, and financial situation.',
          'Web search data reflects current market sentiment but may change rapidly.',
          ...(stockData.currentPrice === 0 ? ['Real-time stock price data not available - analysis based on web research only.'] : [])
        ]
      };
      
      console.log(`📝 DEBUG: Returning analysis result with ${webInsights.length} insights, recommendation: ${recommendation.action}`);
      return analysisResult;
    } catch (error) {
      console.error('❌ Error in comprehensive stock analysis:', error);
      return null;
    }
  }

  /**
   * Extract company name from user query
   */
  private static extractCompanyNameFromQuery(userQuery: string, symbol: string): string {
    // First check if symbol matches known companies from Excel database
    const company = ExcelBasedStockAnalysisService.getCompanyBySymbol(symbol);
    if (company) {
      // Return properly formatted company name
      return company.name.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }

    // Fallback: Extract from query
    const words = userQuery.toLowerCase().split(/\s+/);
    const stopWords = new Set(['should', 'i', 'buy', 'sell', 'stock', 'share', 'shares', 'analysis', 'of', 'about', 'the', 'a', 'an']);
    const companyWords = words.filter(word => !stopWords.has(word) && word.length > 2 && !this.STOCK_KEYWORDS.includes(word));
    
    return companyWords.length > 0 ? 
      companyWords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 
      symbol;
  }

  /**
   * Create fallback stock data when real data is not available
   */
  private static createFallbackStockData(symbol: string, companyName: string): StockAnalysisData {
    return {
      symbol: symbol,
      companyName: companyName || symbol,
      currentPrice: 0, // Will be updated from web search if found
      change: 0,
      changePercent: 0,
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
      sector: 'General',
      industry: 'General',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * SIMPLIFIED: Direct web scraping from first Google result
   */
  private static async extractPriceFromWebSearch(webInsights: WebSearchResult[], stockData: StockAnalysisData): Promise<StockAnalysisData> {
    if (stockData.currentPrice > 0) {
      return stockData; // Already has real-time data
    }

    console.log(`💰 SIMPLIFIED APPROACH: Scraping price from first Google result...`);

    // Step 1: Do a direct Google search for the stock price
    const directPriceData = await this.directGoogleStockSearch(stockData.symbol, stockData.companyName);
    if (directPriceData) {
      console.log(`✅ DIRECT SCRAPING SUCCESS: ₹${directPriceData.currentPrice}`);
      return { ...stockData, ...directPriceData };
    }

    console.log(`⚠️ Direct scraping failed, using basic fallback`);
    return stockData;
  }

  /**
   * SIMPLE DIRECT APPROACH: Google search → First result → Extract price
   */
  private static async directGoogleStockSearch(symbol: string, companyName: string): Promise<Partial<StockAnalysisData> | null> {
    try {
      const apiKey = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
      const searchEngineId = process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID;
      
      if (!apiKey || !searchEngineId) {
        console.error('❌ Google API credentials missing');
        return null;
      }

      // Simple search query - exactly what user would search
      const searchQuery = `${companyName} stock price today`;
      console.log(`🔍 Direct Google search: "${searchQuery}"`);
      
      const searchUrl = `https://www.googleapis.com/customsearch/v1?` + new URLSearchParams({
        key: apiKey,
        cx: searchEngineId,
        q: searchQuery,
        num: '3' // Get top 3 results
      });

      const response = await fetch(searchUrl);
      if (!response.ok) {
        console.error(`❌ Google search failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        console.error(`❌ No search results found for: ${searchQuery}`);
        return null;
      }

      // Try each result until we find price data
      for (let i = 0; i < data.items.length; i++) {
        const result = data.items[i];
        console.log(`🔍 Trying result ${i + 1}: ${result.title}`);
        
        const extractedData = this.extractPriceFromSingleResult(result);
        if (extractedData && extractedData.currentPrice && extractedData.currentPrice > 0) {
          console.log(`✅ SUCCESS from result ${i + 1}: ₹${extractedData.currentPrice}`);
          return extractedData;
        }
      }

      console.log(`❌ No price data found in any of the ${data.items.length} results`);
      return null;

    } catch (error) {
      console.error('❌ Direct Google search error:', error);
      return null;
    }
  }

  /**
   * Extract price data from a single search result (title + snippet)
   */
  private static extractPriceFromSingleResult(result: any): Partial<StockAnalysisData> | null {
    try {
      const text = `${result.title} ${result.snippet}`.toLowerCase();
      console.log(`📄 Analyzing: "${text.substring(0, 100)}..."`);
      
      // Look for price patterns - be more aggressive in extraction
      const pricePatterns = [
        /₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/g,
        /rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/g,
        /price[:\s]*([0-9,]+(?:\.[0-9]{1,2})?)/g,
        /([0-9,]+(?:\.[0-9]{1,2})?)\s*rupees/g
      ];

      for (const pattern of pricePatterns) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
          const priceStr = match[1].replace(/,/g, '');
          const price = parseFloat(priceStr);
          
          // Be more lenient with price validation for Indian stocks
          if (price >= 1 && price <= 100000) {
            console.log(`💰 FOUND PRICE: ₹${price} using pattern: ${pattern.source}`);
            
            // Try to extract percentage change
            const changePattern = /([+-]?\d+(?:\.\d+)?)\s*%/;
            const changeMatch = text.match(changePattern);
            let changePercent = 0;
            
            if (changeMatch) {
              changePercent = parseFloat(changeMatch[1]);
              console.log(`📈 FOUND CHANGE: ${changePercent}%`);
            }

            // Try to extract day high/low
            let dayHigh = 0, dayLow = 0;
            
            const highMatch = text.match(/high[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/);
            if (highMatch) {
              dayHigh = parseFloat(highMatch[1].replace(/,/g, ''));
              console.log(`📊 FOUND HIGH: ₹${dayHigh}`);
            }
            
            const lowMatch = text.match(/low[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/);
            if (lowMatch) {
              dayLow = parseFloat(lowMatch[1].replace(/,/g, ''));
              console.log(`📊 FOUND LOW: ₹${dayLow}`);
            }

            return {
              currentPrice: price,
              changePercent: changePercent,
              change: (price * changePercent) / 100,
              dayHigh: dayHigh > 0 ? dayHigh : undefined,
              dayLow: dayLow > 0 ? dayLow : undefined,
              lastUpdated: new Date().toISOString()
            };
          }
        }
      }

      console.log(`❌ No valid price found in this result`);
      return null;
      
    } catch (error) {
      console.error('❌ Error extracting from single result:', error);
      return null;
    }
  }

  // Removed complex MoneyControl code - keeping it simple now

  /**
   * Test function to verify comprehensive stock database
   */
  static testComprehensiveStockDatabase(): void {
    console.log('🧪 Testing comprehensive stock database with 440+ entries...');
    
    // Test cases for proper symbol extraction with the new comprehensive database
    const testCases = [
      { query: 'Can I buy swiggy shares now?', expected: 'SWIGGY' },
      { query: 'Should I invest in swiggy stock?', expected: 'SWIGGY' },
      { query: 'eternal stock', expected: null },
      { query: 'Zomato share price today', expected: 'ZOMATO' },
      { query: 'Can HDFC bank be a good investment?', expected: 'HDFCBANK' },
      { query: 'Will TCS stock go up?', expected: 'TCS' },
      { query: 'Should I buy Infosys shares?', expected: 'INFY' },
      { query: 'Apollo hospitals stock analysis', expected: 'APOLLOHOSP' },
      { query: 'Bajaj Finance vs Bajaj Auto?', expected: 'BAJFINANCE' }, // Should pick first match
      { query: 'Nykaa IPO investment decision', expected: 'NYKAA' },
      { query: 'PayTM stock worth buying?', expected: 'PAYTM' },
      { query: 'Adani Green Energy share price', expected: 'ADANIGREEN' },
      { query: 'DMart vs Trent retail comparison', expected: 'DMART' }, // Should pick first match
      { query: 'L&T construction stock', expected: 'LT' },
      { query: 'Asian Paints vs Berger Paints', expected: null }, // Asian Paints not in our current comprehensive DB
      { query: 'Reliance Jio listing prospects', expected: 'RELIANCE' },
      { query: 'Vodafone Idea stock turnaround', expected: 'IDEA' },
      { query: 'Coal India dividend yield', expected: 'COALINDIA' },
      { query: 'UltraTech Cement market position', expected: 'ULTRACEMCO' }
    ];
    
    console.log(`📊 Testing ${testCases.length} comprehensive test cases...\n`);
    
    let passCount = 0;
    testCases.forEach((testCase, index) => {
      const result = this.parseStockSymbol(testCase.query);
      const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';
      const isPassing = result === testCase.expected;
      
      console.log(`${(index + 1).toString().padStart(2)}. ${status}: "${testCase.query}"`);
      console.log(`     Expected: ${testCase.expected || 'null'}, Got: ${result || 'null'}`);
      
      if (isPassing) {
        passCount++;
      } else {
        console.log(`     🔍 Analysis: Query should ${testCase.expected ? `extract "${testCase.expected}"` : 'return null'} but got "${result || 'null'}"`);
      }
      console.log('');
    });
    
    console.log(`📈 Test Results: ${passCount}/${testCases.length} tests passed (${(passCount/testCases.length*100).toFixed(1)}%)`);
    
    // Database statistics
    const dbSize = Object.keys(this.INDIAN_STOCKS).length;
    const uniqueSymbols = new Set(Object.values(this.INDIAN_STOCKS)).size;
    console.log(`📊 Database Stats: ${dbSize} entries covering ${uniqueSymbols} unique symbols`);
    
    // Test fuzzy matching specifically
    console.log('\n🧪 Testing fuzzy matching...');
    const fuzzyTests = [
      'eternal stock',
      'eternal',
      'internal company',
      'external factors'
    ];
    
    fuzzyTests.forEach(testCase => {
      const result = this.findFuzzyStockMatch(testCase);
      console.log(`Fuzzy test: "${testCase}" -> ${result || 'No match'}`);
      
      if (testCase.includes('eternal') && result === 'ICICIBANK') {
        console.error(`❌ FUZZY BUG: "${testCase}" incorrectly matched to ICICI!`);
      } else if (testCase.includes('eternal') && !result) {
        console.log(`✅ FUZZY FIXED: "${testCase}" correctly returns no match`);
      }
    });
  }
}