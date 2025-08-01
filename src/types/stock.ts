export interface StockIndex {
  id: string;
  name: string;
  symbol: string;
  description: string;
  sector?: string;
  exchange: 'NSE' | 'BSE';
  category: 'broad' | 'sectoral' | 'size' | 'volatility';
}

export interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap?: number;
  lastUpdated: string;
}

export interface CompanyData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sector: string;
  industry?: string;
}

export interface ChartData {
  timestamp: string;
  price: number;
  volume?: number;
}

export interface IndexFAQ {
  question: string;
  answer: string;
}

export interface TimeFrame {
  id: string;
  label: string;
  value: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'ALL';
}