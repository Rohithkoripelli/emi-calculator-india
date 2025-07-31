import { StockIndex, IndexFAQ } from '../types/stock';

export const INDIAN_INDICES: StockIndex[] = [
  // Broad Market Indices
  {
    id: 'nifty50',
    name: 'NIFTY 50',
    symbol: '^NSEI',
    description: 'India\'s benchmark stock market index representing top 50 companies',
    exchange: 'NSE',
    category: 'broad'
  },
  {
    id: 'sensex',
    name: 'BSE Sensex',
    symbol: '^BSESN',
    description: 'Bombay Stock Exchange benchmark index of 30 companies',
    exchange: 'BSE',
    category: 'broad'
  },
  {
    id: 'nifty100',
    name: 'NIFTY 100',
    symbol: '^CNX100',
    description: 'Top 100 companies by market capitalization',
    exchange: 'NSE',
    category: 'broad'
  },
  {
    id: 'nifty500',
    name: 'NIFTY 500',
    symbol: '^CNX500',
    description: 'Broad market index covering 500 companies',
    exchange: 'NSE',
    category: 'broad'
  },
  {
    id: 'niftytotal',
    name: 'Nifty Total Market',
    symbol: '^CNXTM',
    description: 'Comprehensive market index covering entire equity universe',
    exchange: 'NSE',
    category: 'broad'
  },
  {
    id: 'bse100',
    name: 'BSE 100',
    symbol: '^BSE100',
    description: 'Top 100 companies on Bombay Stock Exchange',
    exchange: 'BSE',
    category: 'broad'
  },

  // Size-based Indices
  {
    id: 'niftynext50',
    name: 'Nifty Next 50',
    symbol: '^CNXN50',
    description: 'Next 50 largest companies after Nifty 50',
    exchange: 'NSE',
    category: 'size'
  },
  {
    id: 'niftymidcap100',
    name: 'NIFTY Midcap 100',
    symbol: '^CNXMIDCAP',
    description: 'Top 100 midcap companies',
    exchange: 'NSE',
    category: 'size'
  },
  {
    id: 'niftymidcap150',
    name: 'NIFTY Midcap 150',
    symbol: '^CNXMIDCAP150',
    description: 'Extended midcap index with 150 companies',
    exchange: 'NSE',
    category: 'size'
  },
  {
    id: 'niftymidcapselect',
    name: 'Nifty Midcap Select',
    symbol: '^CNXMIDSEL',
    description: 'Selected midcap companies',
    exchange: 'NSE',
    category: 'size'
  },
  {
    id: 'niftysmallcap100',
    name: 'NIFTY Smallcap 100',
    symbol: '^CNXSMALLCAP',
    description: 'Top 100 smallcap companies',
    exchange: 'NSE',
    category: 'size'
  },
  {
    id: 'niftysmallcap250',
    name: 'NIFTY Smallcap 250',
    symbol: '^CNXSC250',
    description: 'Extended smallcap index with 250 companies',
    exchange: 'NSE',
    category: 'size'
  },
  {
    id: 'bsesmallcap',
    name: 'BSE Smallcap',
    symbol: '^BSESC',
    description: 'Smallcap stocks on BSE',
    exchange: 'BSE',
    category: 'size'
  },

  // Sectoral Indices
  {
    id: 'niftybank',
    name: 'NIFTY Bank',
    symbol: '^CNXBANK',
    description: 'Banking sector index',
    sector: 'Banking',
    exchange: 'NSE',
    category: 'sectoral'
  },
  {
    id: 'niftyfinancial',
    name: 'Nifty Financial Services',
    symbol: '^CNXFIN',
    description: 'Financial services sector index',
    sector: 'Financial Services',
    exchange: 'NSE',
    category: 'sectoral'
  },
  {
    id: 'bsebankex',
    name: 'BSE Bankex',
    symbol: '^BSEBANK',
    description: 'Banking sector index on BSE',
    sector: 'Banking',
    exchange: 'BSE',
    category: 'sectoral'
  },
  {
    id: 'niftyit',
    name: 'NIFTY IT',
    symbol: '^CNXIT',
    description: 'Information Technology sector index',
    sector: 'Information Technology',
    exchange: 'NSE',
    category: 'sectoral'
  },
  {
    id: 'niftypharma',
    name: 'NIFTY Pharma',
    symbol: '^CNXPHARMA',
    description: 'Pharmaceutical sector index',
    sector: 'Pharmaceuticals',
    exchange: 'NSE',
    category: 'sectoral'
  },
  {
    id: 'niftyauto',
    name: 'NIFTY Auto',
    symbol: '^CNXAUTO',
    description: 'Automotive sector index',
    sector: 'Automotive',
    exchange: 'NSE',
    category: 'sectoral'
  },
  {
    id: 'niftyfmcg',
    name: 'Nifty FMCG',
    symbol: '^CNXFMCG',
    description: 'Fast-moving consumer goods sector',
    sector: 'FMCG',
    exchange: 'NSE',
    category: 'sectoral'
  },
  {
    id: 'niftymetal',
    name: 'NIFTY Metal',
    symbol: '^CNXMETAL',
    description: 'Metal sector index',
    sector: 'Metals',
    exchange: 'NSE',
    category: 'sectoral'
  },
  {
    id: 'niftypsubank',
    name: 'NIFTY PSU Bank',
    symbol: '^CNXPSUBANK',
    description: 'Public sector bank index',
    sector: 'Public Sector Banks',
    exchange: 'NSE',
    category: 'sectoral'
  },
  {
    id: 'niftycommodities',
    name: 'NIFTY Commodities',
    symbol: '^CNXCOMMODITY',
    description: 'Commodities sector index',
    sector: 'Commodities',
    exchange: 'NSE',
    category: 'sectoral'
  },

  // Special Indices
  {
    id: 'indiavix',
    name: 'India VIX',
    symbol: '^INDIAVIX',
    description: 'Volatility index measuring market uncertainty',
    exchange: 'NSE',
    category: 'volatility'
  },
  {
    id: 'bseipo',
    name: 'BSE IPO',
    symbol: '^BSEIPO',
    description: 'IPO-related index',
    exchange: 'BSE',
    category: 'broad'
  }
];

export const INDEX_FAQS: Record<string, IndexFAQ[]> = {
  nifty50: [
    {
      question: "What is NIFTY 50?",
      answer: "NIFTY 50 is the flagship index of the National Stock Exchange of India (NSE). It represents the weighted average of 50 Indian company stocks in 12 sectors and is one of the two stock indices used in India, the other being the BSE SENSEX."
    },
    {
      question: "How are NIFTY 50 companies selected?",
      answer: "Companies are selected based on market capitalization, liquidity, and trading frequency. The index is reviewed semi-annually and changes are made to ensure it represents the Indian equity market accurately."
    },
    {
      question: "What is the base year and value for NIFTY 50?",
      answer: "NIFTY 50 has a base period of November 3, 1995, with a base value of 1000. The index uses the free-float market capitalization method for calculation."
    },
    {
      question: "How often is NIFTY 50 calculated?",
      answer: "NIFTY 50 is calculated in real-time during market hours and is updated every 15 seconds. The index trading hours are from 9:15 AM to 3:30 PM, Monday to Friday."
    }
  ],
  sensex: [
    {
      question: "What is BSE SENSEX?",
      answer: "The S&P BSE SENSEX is a free-float market-weighted stock market index of 30 well-established and financially sound companies listed on the Bombay Stock Exchange (BSE). It is the oldest stock market index in India."
    },
    {
      question: "When was SENSEX launched?",
      answer: "SENSEX was launched on January 1, 1986, with a base year of 1978-79 and a base value of 100. It's one of the most widely tracked indices in India."
    },
    {
      question: "How are SENSEX companies chosen?",
      answer: "Companies are selected based on market capitalization, liquidity, trading frequency, industry representation, and financial track record. The index committee reviews the composition periodically."
    },
    {
      question: "What does SENSEX measure?",
      answer: "SENSEX measures the performance of the top 30 companies on BSE and serves as a barometer of the Indian stock market and economy's health."
    }
  ]
};