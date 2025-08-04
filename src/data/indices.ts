import { StockIndex, IndexFAQ } from '../types/stock';

export const INDIAN_INDICES: StockIndex[] = [
  // NSE Broad Market Indices
  {
    id: 'nifty50',
    name: 'NIFTY 50',
    symbol: '^NSEI',
    description: 'India\'s benchmark stock market index representing top 50 companies',
    exchange: 'NSE',
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

  // BSE Indices
  {
    id: 'sensex',
    name: 'BSE Sensex',
    symbol: '^BSESN',
    description: 'Bombay Stock Exchange benchmark index of 30 companies',
    exchange: 'BSE',
    category: 'broad'
  },
  {
    id: 'bse100',
    name: 'BSE 100',
    symbol: '^BSE100',
    description: 'Top 100 companies on Bombay Stock Exchange',
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