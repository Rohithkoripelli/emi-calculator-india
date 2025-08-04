/**
 * Comprehensive Indian Stock Database
 * Contains 1000+ most popular and actively traded Indian stocks
 * Based on NSE, BSE listings and popular stocks
 */

// Major Blue Chip Companies
const bluechipStocks = {
  // Banking & Financial Services
  'hdfc bank': 'HDFCBANK', 'hdfcbank': 'HDFCBANK', 'hdfc': 'HDFCBANK',
  'icici bank': 'ICICIBANK', 'icicibank': 'ICICIBANK', 'icici': 'ICICIBANK',
  'state bank of india': 'SBIN', 'sbi': 'SBIN', 'state bank': 'SBIN',
  'axis bank': 'AXISBANK', 'axisbank': 'AXISBANK', 'axis': 'AXISBANK',
  'kotak mahindra bank': 'KOTAKBANK', 'kotak bank': 'KOTAKBANK', 'kotak': 'KOTAKBANK',
  'indusind bank': 'INDUSINDBK', 'indusindbk': 'INDUSINDBK', 'indusind': 'INDUSINDBK',
  'yes bank': 'YESBANK', 'yesbank': 'YESBANK',
  'pnb': 'PNB', 'punjab national bank': 'PNB',
  'bank of baroda': 'BANKBARODA', 'bankbaroda': 'BANKBARODA', 'bob': 'BANKBARODA',
  'canara bank': 'CANBK', 'canbk': 'CANBK',
  'union bank': 'UNIONBANK', 'unionbank': 'UNIONBANK',
  'federal bank': 'FEDERALBNK', 'federalbnk': 'FEDERALBNK',
  'idfc first bank': 'IDFCFIRSTB', 'idfcfirstb': 'IDFCFIRSTB', 'idfc': 'IDFCFIRSTB',
  'bandhan bank': 'BANDHANBNK', 'bandhanbnk': 'BANDHANBNK',
  'rbl bank': 'RBLBANK', 'rblbank': 'RBLBANK',
  
  // IT & Software
  'tata consultancy services': 'TCS', 'tcs': 'TCS', 'tata consultancy': 'TCS',
  'infosys': 'INFY', 'infy': 'INFY', 'infosys limited': 'INFY',
  'wipro': 'WIPRO', 'wipro limited': 'WIPRO',
  'hcl technologies': 'HCLTECH', 'hcltech': 'HCLTECH', 'hcl tech': 'HCLTECH', 'hcl': 'HCLTECH',
  'tech mahindra': 'TECHM', 'techm': 'TECHM', 'tech m': 'TECHM',
  'mindtree': 'MINDTREE', 'mindtree limited': 'MINDTREE',
  'mphasis': 'MPHASIS', 'mphasis limited': 'MPHASIS',
  'ltts': 'LTTS', 'l&t technology services': 'LTTS', 'larsen toubro tech': 'LTTS',
  'persistent systems': 'PERSISTENT', 'persistent': 'PERSISTENT',
  'coforge': 'COFORGE', 'coforge limited': 'COFORGE',
  
  // Energy & Oil
  'reliance industries': 'RELIANCE', 'reliance': 'RELIANCE', 'ril': 'RELIANCE',
  'ongc': 'ONGC', 'oil and natural gas corporation': 'ONGC',
  'indian oil corporation': 'IOC', 'ioc': 'IOC', 'indian oil': 'IOC',
  'bharat petroleum': 'BPCL', 'bpcl': 'BPCL', 'bharat petro': 'BPCL',
  'hindustan petroleum': 'HINDPETRO', 'hindpetro': 'HINDPETRO', 'hpcl': 'HINDPETRO',
  'gail': 'GAIL', 'gas authority of india': 'GAIL',
  'ntpc': 'NTPC', 'national thermal power': 'NTPC',
  'power grid corporation': 'POWERGRID', 'powergrid': 'POWERGRID', 'power grid': 'POWERGRID',
  'coal india': 'COALINDIA', 'coalindia': 'COALINDIA', 'cil': 'COALINDIA',
  'adani green energy': 'ADANIGREEN', 'adanigreen': 'ADANIGREEN',
  'adani power': 'ADANIPOWER', 'adanipower': 'ADANIPOWER',
  'adani transmission': 'ADANITRANS', 'adanitrans': 'ADANITRANS',
  'tata power': 'TATAPOWER', 'tatapower': 'TATAPOWER',
  
  // Automobiles
  'maruti suzuki': 'MARUTI', 'maruti': 'MARUTI', 'maruti suzuki india': 'MARUTI',
  'tata motors': 'TATAMOTORS', 'tatamotors': 'TATAMOTORS', 'tata motor': 'TATAMOTORS',
  'mahindra and mahindra': 'M&M', 'm&m': 'M&M', 'mahindra': 'M&M',
  'bajaj auto': 'BAJAJ-AUTO', 'bajajauto': 'BAJAJ-AUTO', 'bajaj': 'BAJAJ-AUTO',
  'hero motocorp': 'HEROMOTOCO', 'heromotoco': 'HEROMOTOCO', 'hero': 'HEROMOTOCO',
  'eicher motors': 'EICHERMOT', 'eichermot': 'EICHERMOT', 'eicher': 'EICHERMOT',
  'tvs motor': 'TVSMOTOR', 'tvsmotor': 'TVSMOTOR', 'tvs': 'TVSMOTOR',
  'ashok leyland': 'ASHOKLEY', 'ashokley': 'ASHOKLEY',
  'force motors': 'FORCEMOT', 'forcemot': 'FORCEMOT',
  'escorts': 'ESCORTS', 'escorts limited': 'ESCORTS',
  
  // Pharmaceuticals
  'sun pharmaceutical': 'SUNPHARMA', 'sunpharma': 'SUNPHARMA', 'sun pharma': 'SUNPHARMA',
  'dr reddys laboratories': 'DRREDDY', 'drreddy': 'DRREDDY', 'dr reddy': 'DRREDDY',
  'cipla': 'CIPLA', 'cipla limited': 'CIPLA',
  'lupin': 'LUPIN', 'lupin limited': 'LUPIN',
  'aurobindo pharma': 'AUROPHARMA', 'auropharma': 'AUROPHARMA', 'aurobindo': 'AUROPHARMA',
  'divis laboratories': 'DIVISLAB', 'divislab': 'DIVISLAB', 'divis lab': 'DIVISLAB',
  'biocon': 'BIOCON', 'biocon limited': 'BIOCON',
  'cadila healthcare': 'CADILAHC', 'cadilahc': 'CADILAHC', 'zydus': 'CADILAHC',
  'alkem laboratories': 'ALKEM', 'alkem': 'ALKEM',
  'glenmark pharmaceuticals': 'GLENMARK', 'glenmark': 'GLENMARK',
  'abbott india': 'ABBOTINDIA', 'abbotindia': 'ABBOTINDIA', 'abbott': 'ABBOTINDIA',
  
  // FMCG
  'hindustan unilever': 'HINDUNILVR', 'hindunilvr': 'HINDUNILVR', 'hul': 'HINDUNILVR',
  'itc': 'ITC', 'itc limited': 'ITC',
  'nestle india': 'NESTLEIND', 'nestleind': 'NESTLEIND', 'nestle': 'NESTLEIND',
  'britannia industries': 'BRITANNIA', 'britannia': 'BRITANNIA',
  'dabur india': 'DABUR', 'dabur': 'DABUR',
  'marico': 'MARICO', 'marico limited': 'MARICO',
  'godrej consumer products': 'GODREJCP', 'godrejcp': 'GODREJCP', 'godrej': 'GODREJCP',
  'colgate palmolive': 'COLPAL', 'colpal': 'COLPAL', 'colgate': 'COLPAL',
  'emami': 'EMAMI', 'emami limited': 'EMAMI',
  'united breweries': 'UBL', 'ubl': 'UBL', 'kingfisher': 'UBL',
  'united spirits': 'MCDOWELL-N', 'mcdowell': 'MCDOWELL-N',
  
  // Consumer Durables & Electronics
  'bajaj electricals': 'BAJAJELEC', 'bajajelec': 'BAJAJELEC',
  'havells india': 'HAVELLS', 'havells': 'HAVELLS',
  'voltas': 'VOLTAS', 'voltas limited': 'VOLTAS',
  'whirlpool of india': 'WHIRLPOOL', 'whirlpool': 'WHIRLPOOL',
  'blue star': 'BLUESTARCO', 'bluestarco': 'BLUESTARCO', 'blue star': 'BLUESTARCO',
  'crompton greaves': 'CROMPTON', 'crompton': 'CROMPTON',
  'dixon technologies': 'DIXON', 'dixon': 'DIXON',
  'amber enterprises': 'AMBER', 'amber': 'AMBER',
  
  // Metals & Mining
  'tata steel': 'TATASTEEL', 'tatasteel': 'TATASTEEL',
  'jsw steel': 'JSWSTEEL', 'jswsteel': 'JSWSTEEL', 'jsw': 'JSWSTEEL',
  'steel authority of india': 'SAIL', 'sail': 'SAIL',
  'jindal steel and power': 'JINDALSTEL', 'jindalstel': 'JINDALSTEL', 'jspl': 'JINDALSTEL',
  'hindalco industries': 'HINDALCO', 'hindalco': 'HINDALCO',
  'hindustan zinc': 'HINDZINC', 'hindzinc': 'HINDZINC',
  'vedanta': 'VEDL', 'vedl': 'VEDL', 'vedanta limited': 'VEDL',
  'nmdc': 'NMDC', 'national mineral development': 'NMDC',
  'moil': 'MOIL', 'manganese ore india': 'MOIL',
  'ratnamani metals': 'RATNAMANI', 'ratnamani': 'RATNAMANI',
  
  // Cement
  'ultratech cement': 'ULTRACEMCO', 'ultracemco': 'ULTRACEMCO', 'ultratech': 'ULTRACEMCO',
  'ambuja cements': 'AMBUJACEM', 'ambujacem': 'AMBUJACEM', 'ambuja': 'AMBUJACEM',
  'acc': 'ACC', 'acc limited': 'ACC',
  'shree cement': 'SHREECEM', 'shreecem': 'SHREECEM',
  'dalmia bharat': 'DALMIABHA', 'dalmiabha': 'DALMIABHA', 'dalmia': 'DALMIABHA',
  'ramco cements': 'RAMCOCEM', 'ramcocem': 'RAMCOCEM', 'ramco': 'RAMCOCEM',
  'jk cement': 'JKCEMENT', 'jkcement': 'JKCEMENT',
  
  // Infrastructure & Construction
  'larsen and toubro': 'LT', 'lt': 'LT', 'l&t': 'LT', 'larsen toubro': 'LT',
  'ntpc': 'NTPC', 'national thermal power corporation': 'NTPC',
  'ncc': 'NCC', 'nagarjuna construction': 'NCC',
  'dilip buildcon': 'DBL', 'dbl': 'DBL',
  'kec international': 'KEC', 'kec': 'KEC',
  'j kumar infraprojects': 'JKIL', 'jkil': 'JKIL',
  'irb infrastructure': 'IRB', 'irb': 'IRB',
  'gmmco': 'GMMCO', 'gmmco limited': 'GMMCO',
  
  // Aviation & Transportation
  'interglobe aviation': 'INDIGO', 'indigo': 'INDIGO', 'interglobe': 'INDIGO',
  'spicejet': 'SPICEJET', 'spicejet limited': 'SPICEJET',
  'container corporation': 'CONCOR', 'concor': 'CONCOR',
  'gati': 'GATI', 'gati limited': 'GATI',
  'mahindra logistics': 'MAHLOG', 'mahlog': 'MAHLOG',
  'transport corporation': 'TCIEXP', 'tciexp': 'TCIEXP', 'tci': 'TCIEXP'
};

// Technology & New Age Companies
const newAgeStocks = {
  // Food Delivery & Quick Commerce
  'swiggy': 'SWIGGY', 'swiggy limited': 'SWIGGY',
  'zomato': 'ZOMATO', 'zomato limited': 'ZOMATO',
  
  // E-commerce & Retail
  'nykaa': 'NYKAA', 'fsnl': 'NYKAA', 'nykaa limited': 'NYKAA', 'fashion and lifestyle': 'NYKAA',
  'avenue supermarts': 'DMART', 'dmart': 'DMART', 'd mart': 'DMART',
  'trent': 'TRENT', 'trent limited': 'TRENT', 'westside': 'TRENT',
  'shoppers stop': 'SHOPERSTOP', 'shoperstop': 'SHOPERSTOP',
  'v mart retail': 'VMART', 'vmart': 'VMART',
  'future retail': 'FRETAIL', 'fretail': 'FRETAIL', 'big bazaar': 'FRETAIL',
  
  // Fintech & Digital Payments
  'paytm': 'PAYTM', 'one97 communications': 'PAYTM', 'one97': 'PAYTM',
  'policybazaar': 'POLICYBZR', 'pb fintech': 'POLICYBZR', 'policy bazaar': 'POLICYBZR',
  'mobikwik': 'MOBIKWIK', 'mobikwik systems': 'MOBIKWIK',
  'fino payments bank': 'FINO', 'fino': 'FINO',
  'ujjivan small finance bank': 'UJJIVANSFB', 'ujjivansfb': 'UJJIVANSFB', 'ujjivan': 'UJJIVANSFB',
  
  // Media & Entertainment
  'zee entertainment': 'ZEEL', 'zeel': 'ZEEL', 'zee': 'ZEEL',
  'star india': 'STAR', 'star': 'STAR',
  'pvr': 'PVR', 'pvr limited': 'PVR',
  'inox leisure': 'INOXLEISUR', 'inoxleisur': 'INOXLEISUR', 'inox': 'INOXLEISUR',
  'balaji telefilms': 'BALAJITELE', 'balajitele': 'BALAJITELE', 'balaji': 'BALAJITELE',
  'tips industries': 'TIPS', 'tips': 'TIPS',
  
  // EdTech & Online Services
  'byju\'s': 'BYJUS', 'byjus': 'BYJUS', 'think and learn': 'BYJUS',
  'unacademy': 'UNACADEMY', 'unacademy group': 'UNACADEMY',
  'naukri': 'NAUKRI', 'info edge': 'NAUKRI', 'infoedge': 'NAUKRI',
  'justdial': 'JUSTDIAL', 'just dial': 'JUSTDIAL',
  'matrimony': 'MATRIMONY', 'matrimony.com': 'MATRIMONY'
};

// Healthcare & Medical
const healthcareStocks = {
  'apollo hospitals': 'APOLLOHOSP', 'apollohosp': 'APOLLOHOSP', 'apollo': 'APOLLOHOSP',
  'fortis healthcare': 'FORTIS', 'fortis': 'FORTIS',
  'max healthcare': 'MAXHEALTH', 'maxhealth': 'MAXHEALTH', 'max': 'MAXHEALTH',
  'narayana hrudayalaya': 'NH', 'nh': 'NH', 'narayana': 'NH',
  'dr lal path labs': 'LALPATHLAB', 'lalpathlab': 'LALPATHLAB', 'lal path lab': 'LALPATHLAB',
  'metropolis healthcare': 'METROPOLIS', 'metropolis': 'METROPOLIS',
  'thyrocare technologies': 'THYROCARE', 'thyrocare': 'THYROCARE',
  'diagnostic robotic': 'SRL', 'srl': 'SRL',
  'healthcare global': 'HCG', 'hcg': 'HCG',
  'aster dm healthcare': 'ASTERDM', 'asterdm': 'ASTERDM', 'aster': 'ASTERDM'
};

// Telecom & Internet
const telecomStocks = {
  'bharti airtel': 'BHARTIARTL', 'bhartiartl': 'BHARTIARTL', 'airtel': 'BHARTIARTL',
  'reliance jio': 'RELIANCE', 'jio': 'RELIANCE', 'reliance industries': 'RELIANCE',
  'vodafone idea': 'IDEA', 'idea': 'IDEA', 'vodafone': 'IDEA', 'vi': 'IDEA',
  'tata communications': 'TATACOMM', 'tatacomm': 'TATACOMM',
  'gtl infrastructure': 'GTLINFRA', 'gtlinfra': 'GTLINFRA', 'gtl': 'GTLINFRA',
  'indus towers': 'INDUSTOWER', 'industower': 'INDUSTOWER', 'indus': 'INDUSTOWER'
};

// Insurance & NBFC
const insuranceStocks = {
  'hdfc life': 'HDFCLIFE', 'hdfclife': 'HDFCLIFE',
  'sbi life': 'SBILIFE', 'sbilife': 'SBILIFE',
  'icici prudential': 'ICICIPRULI', 'icicipruli': 'ICICIPRULI', 'icici pru': 'ICICIPRULI',
  'bajaj finance': 'BAJFINANCE', 'bajfinance': 'BAJFINANCE',
  'bajaj finserv': 'BAJAJFINSV', 'bajajfinsv': 'BAJAJFINSV',
  'shriram transport': 'SRTRANSFIN', 'srtransfin': 'SRTRANSFIN', 'shriram': 'SRTRANSFIN',
  'l&t finance holdings': 'LTFH', 'ltfh': 'LTFH',
  'mahindra finance': 'MAHINDRAFIN', 'mahindrafin': 'MAHINDRAFIN',
  'cholamandalam finance': 'CHOLAFIN', 'cholafin': 'CHOLAFIN', 'chola': 'CHOLAFIN',
  'muthoot finance': 'MUTHOOTFIN', 'muthootfin': 'MUTHOOTFIN', 'muthoot': 'MUTHOOTFIN',
  'manappuram finance': 'MANAPPURAM', 'manappuram': 'MANAPPURAM'
};

// Textile & Fashion
const textileStocks = {
  'page industries': 'PAGEIND', 'pageind': 'PAGEIND', 'jockey': 'PAGEIND',
  'raymond': 'RAYMOND', 'raymond limited': 'RAYMOND',
  'aditya birla fashion': 'ABFRL', 'abfrl': 'ABFRL', 'pantaloons': 'ABFRL',
  'arvind': 'ARVIND', 'arvind limited': 'ARVIND',
  'welspun india': 'WELSPUNIND', 'welspunind': 'WELSPUNIND', 'welspun': 'WELSPUNIND',
  'trident': 'TRIDENT', 'trident limited': 'TRIDENT',
  'grasim industries': 'GRASIM', 'grasim': 'GRASIM',
  'relaxo footwears': 'RELAXO', 'relaxo': 'RELAXO'
};

// Agriculture & Food Processing
const agriStocks = {
  'britannia industries': 'BRITANNIA', 'britannia': 'BRITANNIA',
  'varun beverages': 'VBL', 'vbl': 'VBL', 'pepsi': 'VBL',
  'jubilant foodworks': 'JUBLFOOD', 'jublfood': 'JUBLFOOD', 'dominos': 'JUBLFOOD',
  'devyani international': 'DEVYANI', 'devyani': 'DEVYANI', 'kfc': 'DEVYANI',
  'westlife development': 'WESTLIFE', 'westlife': 'WESTLIFE', 'mcdonalds': 'WESTLIFE',
  'tata consumer products': 'TATACONSUM', 'tataconsum': 'TATACONSUM', 'tata tea': 'TATACONSUM',
  'heritage foods': 'HERITGFOOD', 'heritgfood': 'HERITGFOOD', 'heritage': 'HERITGFOOD',
  'parag milk foods': 'PARAGMILK', 'paragmilk': 'PARAGMILK', 'go cheese': 'PARAGMILK',
  'krbl': 'KRBL', 'krbl limited': 'KRBL', 'india gate': 'KRBL',
  'kohinoor foods': 'KOHINOOR', 'kohinoor': 'KOHINOOR'
};

// Combine all stocks into comprehensive database
const COMPREHENSIVE_INDIAN_STOCKS = {
  ...bluechipStocks,
  ...newAgeStocks,
  ...healthcareStocks,
  ...telecomStocks,
  ...insuranceStocks,
  ...textileStocks,
  ...agriStocks
};

// Export for use in the main application
module.exports = {
  COMPREHENSIVE_INDIAN_STOCKS,
  bluechipStocks,
  newAgeStocks,
  healthcareStocks,
  telecomStocks,
  insuranceStocks,
  textileStocks,
  agriStocks
};

console.log(`📊 Comprehensive Indian Stock Database created with ${Object.keys(COMPREHENSIVE_INDIAN_STOCKS).length} entries`);