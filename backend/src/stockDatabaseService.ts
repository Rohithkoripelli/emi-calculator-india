/**
 * Stock Database Service
 * MongoDB integration for stock data management with comprehensive CRUD operations
 */

import { 
  StockDocument, 
  IndexDocument, 
  DataUpdateLog, 
  StockUpdateResult,
  BulkUpdateResult,
  StockFundamentals,
  ApiResponse
} from './stockDataModels';
import MongoDBConnection from '../config/mongodb';

class StockDatabaseService {
  private static mongoConnection: MongoDBConnection | null = null;
  private static isInitialized = false;

  /**
   * Initialize database connection
   */
  private static async ensureConnection(): Promise<void> {
    if (!this.mongoConnection) {
      this.mongoConnection = MongoDBConnection.getInstance();
      await this.mongoConnection.connect();
    }

    if (!this.isInitialized) {
      await this.mongoConnection.initializeDatabase();
      this.isInitialized = true;
    }
  }


  /**
   * Get stock by symbol
   */
  static async getStock(symbol: string): Promise<StockDocument | null> {
    try {
      await this.ensureConnection();
      const collection = this.mongoConnection!.getStocksCollection();
      
      const stock = await collection.findOne({ _id: symbol.toUpperCase() });
      return stock;
    } catch (error) {
      console.error(`❌ Error fetching stock ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Update stock price data
   */
  static async updateStockPrice(symbol: string, priceData: {
    price: number;
    dayChange: number;
    dayChangePercent: number;
    volume: number;
  }): Promise<boolean> {
    try {
      await this.ensureConnection();
      const collection = this.mongoConnection!.getStocksCollection();
      
      const updateData = {
        $set: {
          price: priceData.price,
          dayChange: priceData.dayChange,
          dayChangePercent: priceData.dayChangePercent,
          volume: priceData.volume,
          lastPriceUpdate: new Date(),
          updatedAt: new Date()
        },
        $setOnInsert: {
          _id: symbol.toUpperCase(),
          name: `${symbol} Limited`,
          sector: 'Unknown',
          marketCapCategory: 'SMALL_CAP' as const, // Default, will be updated with fundamentals
          fundamentals: {},
          lastFundamentalUpdate: new Date(0), // Epoch date to indicate no fundamentals yet
          createdAt: new Date(),
          indices: []
        }
      };

      const result = await collection.updateOne(
        { _id: symbol.toUpperCase() },
        updateData,
        { upsert: true }
      );

      return result.acknowledged;
    } catch (error) {
      console.error(`❌ Error updating stock price for ${symbol}:`, error);
      return false;
    }
  }

  /**
   * Update stock fundamentals from screener.in
   */
  static async updateStockFundamentals(symbol: string, fundamentals: StockFundamentals, companyInfo?: {
    name?: string;
    sector?: string;
    industry?: string;
  }): Promise<boolean> {
    try {
      await this.ensureConnection();
      const collection = this.mongoConnection!.getStocksCollection();
      
      const marketCapCategory = fundamentals.marketCap ? 
        this.determineMarketCapCategory(fundamentals.marketCap) : 'SMALL_CAP';
      
      const indices = await this.determineIndexMemberships(symbol);

      const updateData = {
        $set: {
          fundamentals: fundamentals,
          lastFundamentalUpdate: new Date(),
          updatedAt: new Date(),
          marketCapCategory,
          indices,
          ...(companyInfo?.name && { name: companyInfo.name }),
          ...(companyInfo?.sector && { sector: companyInfo.sector }),
          ...(companyInfo?.industry && { industry: companyInfo.industry })
        },
        $setOnInsert: {
          _id: symbol.toUpperCase(),
          name: companyInfo?.name || `${symbol} Limited`,
          sector: companyInfo?.sector || 'Unknown',
          price: 0, // Will be updated separately
          dayChange: 0,
          dayChangePercent: 0,
          volume: 0,
          lastPriceUpdate: new Date(0),
          createdAt: new Date()
        }
      };

      const result = await collection.updateOne(
        { _id: symbol.toUpperCase() },
        updateData,
        { upsert: true }
      );

      return result.acknowledged;
    } catch (error) {
      console.error(`❌ Error updating stock fundamentals for ${symbol}:`, error);
      return false;
    }
  }

  /**
   * Determine market cap category from screener.in market cap string
   */
  private static determineMarketCapCategory(marketCapStr: string): 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' {
    const cleanStr = marketCapStr.replace(/[₹,]/g, '').trim().toUpperCase();
    const match = cleanStr.match(/(\d+(?:\.\d+)?)\s*([A-Z]+)/);
    
    if (!match) return 'SMALL_CAP';
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    let crores: number;
    if (unit.includes('L')) {
      crores = value * 100000; // Lakh crores
    } else if (unit.includes('CR') || unit.includes('CRORE')) {
      crores = value;
    } else {
      crores = value;
    }
    
    // SEBI guidelines
    if (crores > 20000) return 'LARGE_CAP';
    else if (crores > 5000) return 'MID_CAP';
    else return 'SMALL_CAP';
  }

  /**
   * Determine index memberships for a stock
   */
  private static async determineIndexMemberships(symbol: string): Promise<string[]> {
    try {
      await this.ensureConnection();
      const collection = this.mongoConnection!.getIndicesCollection();
      
      const indices = await collection.find({ 
        stocks: { $in: [symbol.toUpperCase()] } 
      }).toArray();
      
      return indices.map(index => index._id);
    } catch (error) {
      console.error(`❌ Error determining index memberships for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get stocks by market cap category
   */
  static async getStocksByCategory(category: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP'): Promise<StockDocument[]> {
    try {
      await this.ensureConnection();
      const collection = this.mongoConnection!.getStocksCollection();
      
      const stocks = await collection.find({
        marketCapCategory: category,
        price: { $gt: 0 },
        fundamentals: { $exists: true, $ne: {} }
      }).sort({ qualityScore: -1 }).toArray();
      
      return stocks;
    } catch (error) {
      console.error(`❌ Error fetching stocks by category ${category}:`, error);
      return [];
    }
  }

  /**
   * Get all indices
   */
  static async getAllIndices(): Promise<IndexDocument[]> {
    try {
      await this.ensureConnection();
      const collection = this.mongoConnection!.getIndicesCollection();
      
      const indices = await collection.find({}).toArray();
      return indices;
    } catch (error) {
      console.error(`❌ Error fetching indices:`, error);
      return [];
    }
  }

  /**
   * Get stocks that need price updates (older than 1 hour)
   */
  static async getStocksNeedingPriceUpdate(): Promise<string[]> {
    try {
      await this.ensureConnection();
      const collection = this.mongoConnection!.getStocksCollection();
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const stocks = await collection.find({
        lastPriceUpdate: { $lt: oneHourAgo }
      }, { projection: { _id: 1 } }).toArray();
      
      return stocks.map(stock => stock._id);
    } catch (error) {
      console.error(`❌ Error fetching stocks needing price update:`, error);
      return [];
    }
  }

  /**
   * Get stocks that need fundamental updates (older than 24 hours)
   */
  static async getStocksNeedingFundamentalUpdate(): Promise<string[]> {
    try {
      await this.ensureConnection();
      const indicesCollection = this.mongoConnection!.getIndicesCollection();
      const stocksCollection = this.mongoConnection!.getStocksCollection();
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Get all symbols from indices
      const indices = await indicesCollection.find({}).toArray();
      const allSymbols = new Set<string>();
      indices.forEach(index => {
        index.stocks.forEach(symbol => allSymbols.add(symbol));
      });
      
      // Find stocks that either don't exist or have old fundamental data
      const symbolsArray = Array.from(allSymbols);
      const existingStocks = await stocksCollection.find({
        _id: { $in: symbolsArray },
        lastFundamentalUpdate: { $gte: oneDayAgo }
      }, { projection: { _id: 1 } }).toArray();
      
      const existingSymbols = new Set(existingStocks.map(stock => stock._id));
      const needsUpdate = symbolsArray.filter(symbol => !existingSymbols.has(symbol));
      
      return needsUpdate;
    } catch (error) {
      console.error(`❌ Error fetching stocks needing fundamental update:`, error);
      return [];
    }
  }

  /**
   * Log data update operation
   */
  static async logUpdate(log: Omit<DataUpdateLog, '_id'>): Promise<void> {
    try {
      await this.ensureConnection();
      const collection = this.mongoConnection!.getUpdateLogsCollection();
      
      const logEntry: DataUpdateLog = {
        _id: `${log.type}-${Date.now()}`,
        ...log
      };
      
      await collection.insertOne(logEntry);
      
      // Keep only last 100 logs (cleanup old logs)
      const totalLogs = await collection.countDocuments();
      if (totalLogs > 100) {
        const oldLogs = await collection.find({})
          .sort({ startTime: 1 })
          .limit(totalLogs - 100)
          .toArray();
        
        if (oldLogs.length > 0) {
          const oldIds = oldLogs.map(log => log._id);
          await collection.deleteMany({ _id: { $in: oldIds } });
        }
      }
      
      console.log(`📝 Logged ${log.type} operation: ${log.status}, ${log.recordsUpdated} records, ${log.duration}ms`);
    } catch (error) {
      console.error(`❌ Error logging update:`, error);
    }
  }

  /**
   * Get database statistics
   */
  static async getStats(): Promise<{
    totalStocks: number;
    stocksWithPrices: number;
    stocksWithFundamentals: number;
    recentPriceUpdates: number;
    recentFundamentalUpdates: number;
    totalIndices: number;
    lastUpdate: Date | null;
  }> {
    try {
      await this.ensureConnection();
      const stocksCollection = this.mongoConnection!.getStocksCollection();
      const indicesCollection = this.mongoConnection!.getIndicesCollection();
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const [
        totalStocks,
        stocksWithPrices,
        stocksWithFundamentals,
        recentPriceUpdates,
        recentFundamentalUpdates,
        totalIndices,
        lastUpdateDoc
      ] = await Promise.all([
        stocksCollection.countDocuments(),
        stocksCollection.countDocuments({ price: { $gt: 0 } }),
        stocksCollection.countDocuments({ fundamentals: { $exists: true, $ne: {} } }),
        stocksCollection.countDocuments({ lastPriceUpdate: { $gte: oneHourAgo } }),
        stocksCollection.countDocuments({ lastFundamentalUpdate: { $gte: oneDayAgo } }),
        indicesCollection.countDocuments(),
        stocksCollection.findOne({}, { sort: { updatedAt: -1 }, projection: { updatedAt: 1 } })
      ]);
      
      return {
        totalStocks,
        stocksWithPrices,
        stocksWithFundamentals,
        recentPriceUpdates,
        recentFundamentalUpdates,
        totalIndices,
        lastUpdate: lastUpdateDoc?.updatedAt || null
      };
    } catch (error) {
      console.error(`❌ Error getting database stats:`, error);
      return {
        totalStocks: 0,
        stocksWithPrices: 0,
        stocksWithFundamentals: 0,
        recentPriceUpdates: 0,
        recentFundamentalUpdates: 0,
        totalIndices: 0,
        lastUpdate: null
      };
    }
  }

  /**
   * Get all stocks with fundamental data for scoring
   */
  static async getAllStocksWithFundamentals(): Promise<any[]> {
    try {
      await this.ensureConnection();
      const collection = this.mongoConnection!.getStocksCollection();
      
      const stocks = await collection.find({
        'fundamentals.peRatio': { $exists: true, $ne: null },
        'fundamentals.roe': { $exists: true, $ne: null },
        'fundamentals.roce': { $exists: true, $ne: null },
        'fundamentals.debtToEquity': { $exists: true, $ne: null },
        'fundamentals.revenueGrowth': { $exists: true, $ne: null },
        'fundamentals.profitGrowth': { $exists: true, $ne: null }
      }).toArray();
      
      return stocks;
    } catch (error) {
      console.error(`❌ Error fetching stocks with fundamentals:`, error);
      return [];
    }
  }

  /**
   * Update stock with calculated score and market cap category
   */
  static async updateStockScore(symbol: string, scoreData: {
    qualityScore: number;
    scoreBreakdown: any;
    marketCapCategory: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP';
    rank: number;
    lastScoreUpdate: Date;
  }): Promise<boolean> {
    try {
      await this.ensureConnection();
      const collection = this.mongoConnection!.getStocksCollection();
      
      const result = await collection.updateOne(
        { _id: symbol.toUpperCase() },
        {
          $set: {
            qualityScore: scoreData.qualityScore,
            scoreBreakdown: scoreData.scoreBreakdown,
            marketCapCategory: scoreData.marketCapCategory,
            rank: scoreData.rank,
            lastScoreUpdate: scoreData.lastScoreUpdate,
            updatedAt: new Date()
          }
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error(`❌ Error updating score for ${symbol}:`, error);
      return false;
    }
  }

  /**
   * Get top stocks by market cap category
   */
  static async getTopStocksByCategory(
    category: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP',
    limit: number = 10
  ): Promise<any[]> {
    try {
      await this.ensureConnection();
      const collection = this.mongoConnection!.getStocksCollection();
      
      const stocks = await collection.find({
        marketCapCategory: category,
        qualityScore: { $exists: true, $ne: null }
      })
      .sort({ qualityScore: -1 }) // Highest score first
      .limit(limit)
      .toArray();
      
      return stocks;
    } catch (error) {
      console.error(`❌ Error fetching top stocks for ${category}:`, error);
      return [];
    }
  }

  /**
   * Get scoring statistics for analysis
   */
  static async getScoringStatistics(): Promise<any> {
    try {
      await this.ensureConnection();
      const collection = this.mongoConnection!.getStocksCollection();
      
      const stats = await collection.aggregate([
        {
          $match: {
            qualityScore: { $exists: true, $ne: null },
            marketCapCategory: { $exists: true }
          }
        },
        {
          $group: {
            _id: "$marketCapCategory",
            count: { $sum: 1 },
            avgScore: { $avg: "$qualityScore" },
            maxScore: { $max: "$qualityScore" },
            minScore: { $min: "$qualityScore" }
          }
        }
      ]).toArray();
      
      return stats;
    } catch (error) {
      console.error(`❌ Error getting scoring statistics:`, error);
      return [];
    }
  }

  /**
   * Get all stock symbols from excel companies data
   */
  static async getAllStockSymbols(): Promise<string[]> {
    try {
      const companies = require('../data/excel-companies.json');
      return companies.map((company: any) => company.symbol);
    } catch (error) {
      console.error(`❌ Error reading excel companies data:`, error);
      return [];
    }
  }

  /**
   * Clear all data (for testing/reset)
   */
  static async clearAllData(): Promise<void> {
    try {
      await this.ensureConnection();
      const stocksCollection = this.mongoConnection!.getStocksCollection();
      const logsCollection = this.mongoConnection!.getUpdateLogsCollection();
      
      await Promise.all([
        stocksCollection.deleteMany({}),
        logsCollection.deleteMany({})
      ]);
      
      console.log(`🗑️ Cleared all stock data from MongoDB`);
    } catch (error) {
      console.error(`❌ Error clearing data:`, error);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  static async disconnect(): Promise<void> {
    if (this.mongoConnection) {
      await this.mongoConnection.disconnect();
      this.mongoConnection = null;
      this.isInitialized = false;
    }
  }
}

export default StockDatabaseService;