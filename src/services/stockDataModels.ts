/**
 * MongoDB Schema Models for Stock Data Management
 * Comprehensive data models for storing stock fundamentals, prices, and indices
 */

export interface StockFundamentals {
  peRatio?: number;
  pbRatio?: number;
  roe?: number;           // Return on Equity
  roce?: number;          // Return on Capital Employed
  debtToEquity?: number;
  revenueGrowth?: number;
  profitGrowth?: number;
  dividendYield?: number;
  currentRatio?: number;
  eps?: number;           // Earnings Per Share
  bookValue?: number;
  marketCap?: string;     // e.g., "₹7,758 Cr"
  faceValue?: number;
  evEbitda?: number;
  
  // Quarterly Results
  quarterlyResults?: QuarterlyResult[];
  
  // Shareholding Pattern
  shareholdingPattern?: ShareholdingPattern[];
  
  // Additional metrics from screener.in
  salesGrowth?: number;
  operatingMargin?: number;
  netMargin?: number;
  assetTurnover?: number;
}

export interface QuarterlyResult {
  quarter: string;        // e.g., "Mar 2024"
  revenue: number;        // in ₹ Cr
  profit: number;         // in ₹ Cr
  eps: number;           // in ₹
  percentageChange?: number;
}

export interface ShareholdingPattern {
  category: string;       // e.g., "Promoters", "FII", "DII"
  percentage: number;
  shares?: number;
}

export interface StockDocument {
  _id: string;           // Stock symbol (e.g., "INFY")
  name: string;          // Company name (e.g., "Infosys Limited")
  sector: string;        // e.g., "Information Technology"
  industry?: string;     // e.g., "Software Services"
  marketCapCategory: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP';
  
  // Real-time price data
  price: number;         // Current price from Groww API
  dayChange: number;     // Price change
  dayChangePercent: number;
  volume: number;
  
  // Fundamental data from screener.in
  fundamentals: StockFundamentals;
  
  // Calculated metrics
  qualityScore?: number;  // Our calculated score (0-1)
  riskScore?: number;     // Risk assessment (0-1)
  
  // Metadata
  lastPriceUpdate: Date;      // Last price update from Groww
  lastFundamentalUpdate: Date; // Last fundamental update from screener.in
  createdAt: Date;
  updatedAt: Date;
  
  // Index memberships
  indices: string[];      // e.g., ["NIFTY50", "NIFTY100", "NIFTYNEXT50"]
}

export interface IndexDocument {
  _id: string;           // Index name (e.g., "NIFTY50")
  name: string;          // Display name (e.g., "Nifty 50")
  category: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP';
  description: string;
  stocks: string[];      // Array of stock symbols
  lastUpdated: Date;
  
  // Index characteristics
  avgMarketCap?: number;
  totalStocks: number;
  minMarketCap?: number;
  maxMarketCap?: number;
}

export interface DataUpdateLog {
  _id?: string;
  type: 'PRICE_UPDATE' | 'FUNDAMENTAL_UPDATE' | 'INDEX_UPDATE';
  symbol?: string;       // For individual stock updates
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  recordsUpdated: number;
  startTime: Date;
  endTime: Date;
  duration: number;      // in milliseconds
  errors?: string[];
  rateLimit?: {
    requestsMade: number;
    delayApplied: number;
  };
}

export interface ScoringWeights {
  peRatio: number;       // Weight for P/E ratio (lower is better)
  roe: number;           // Weight for ROE (higher is better)
  roce: number;          // Weight for ROCE (higher is better)
  debtToEquity: number;  // Weight for Debt-to-Equity (lower is better)
  revenueGrowth: number; // Weight for Revenue Growth (higher is better)
  profitGrowth: number;  // Weight for Profit Growth (higher is better)
  dividendYield: number; // Weight for Dividend Yield (higher is better)
  currentRatio: number;  // Weight for Current Ratio (moderate is better)
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  peRatio: 0.15,         // 15% - Lower P/E is better (value stocks)
  roe: 0.20,             // 20% - Higher ROE indicates better management efficiency
  roce: 0.20,            // 20% - Higher ROCE shows better capital utilization
  debtToEquity: 0.10,    // 10% - Lower debt is generally safer
  revenueGrowth: 0.15,   // 15% - Revenue growth indicates business expansion
  profitGrowth: 0.15,    // 15% - Profit growth shows operational efficiency
  dividendYield: 0.05,   // 5% - Dividend yield for income investors
  currentRatio: 0.00     // 0% - Will implement later for liquidity assessment
};

export interface AllocationRequest {
  totalAmount: number;
  allocations: {
    largeCap: number;    // Percentage (0-100)
    midCap: number;      // Percentage (0-100)
    smallCap: number;    // Percentage (0-100)
  };
  maxStocksPerCategory: number; // e.g., 3-5 stocks per category
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface StockRecommendation {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  allocation: number;    // Amount in ₹
  quantity: number;      // Number of shares
  score: number;         // Quality score (0-1)
  reasoning: string;     // Why this stock was recommended
  fundamentals: {
    peRatio?: number;
    roe?: number;
    roce?: number;
    marketCap?: string;
  };
}

export interface PortfolioRecommendation {
  totalAmount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  categories: {
    largeCap: {
      targetAmount: number;
      allocatedAmount: number;
      stocks: StockRecommendation[];
    };
    midCap: {
      targetAmount: number;
      allocatedAmount: number;
      stocks: StockRecommendation[];
    };
    smallCap: {
      targetAmount: number;
      allocatedAmount: number;
      stocks: StockRecommendation[];
    };
  };
  summary: {
    totalStocks: number;
    avgScore: number;
    riskLevel: string;
    expectedReturn: string;
  };
  generatedAt: Date;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  requestId?: string;
}

export interface StockUpdateResult {
  symbol: string;
  priceUpdated: boolean;
  fundamentalsUpdated: boolean;
  errors: string[];
  lastUpdate: Date;
}

export interface BulkUpdateResult {
  totalRequested: number;
  successful: number;
  failed: number;
  skipped: number;
  results: StockUpdateResult[];
  duration: number;
  rateLimit: {
    requestsMade: number;
    averageDelay: number;
  };
}