/**
 * MongoDB Service for Yahoo Finance Stock Data Persistence
 * Handles storing and retrieving stock data from MongoDB Atlas
 */

const { MongoClient } = require('mongodb');

class MongoDBService {
  constructor() {
    this.connectionString = 'mongodb+srv://reddyrohith705:jehu5yDOINJIMNoI@cluster0.hgipoar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.dbName = 'stock_data';
    this.collectionName = 'yahoo_finance_stocks';
    console.log('📊 MongoDB Service initialized');
  }

  /**
   * Connect to MongoDB Atlas
   */
  async connect() {
    try {
      if (this.isConnected) {
        console.log('✅ MongoDB already connected');
        return true;
      }

      console.log('🔗 Connecting to MongoDB Atlas...');
      this.client = new MongoClient(this.connectionString, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.isConnected = true;
      
      console.log('✅ MongoDB Atlas connected successfully');
      console.log(`📂 Using database: ${this.dbName}`);
      console.log(`📋 Collection: ${this.collectionName}`);
      
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        console.log('🔌 MongoDB disconnected successfully');
      }
    } catch (error) {
      console.error('⚠️ Error disconnecting from MongoDB:', error.message);
    }
  }

  /**
   * Save Yahoo Finance stock data to MongoDB
   */
  async saveStockData(stocksData) {
    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) {
          throw new Error('Failed to connect to MongoDB');
        }
      }

      if (!Array.isArray(stocksData) || stocksData.length === 0) {
        console.log('⚠️ No stock data provided to save');
        return { success: false, message: 'No data provided' };
      }

      const collection = this.db.collection(this.collectionName);
      
      // Add metadata to each stock record
      const enrichedStocks = stocksData.map(stock => ({
        ...stock,
        _id: stock.symbol, // Use symbol as unique identifier
        lastUpdated: new Date(),
        dataSource: 'yahoo-finance-api',
        collectionDate: new Date(),
        version: '1.0'
      }));

      console.log(`💾 Saving ${enrichedStocks.length} stocks to MongoDB...`);
      
      // Use bulk operations for better performance
      const bulkOps = enrichedStocks.map(stock => ({
        replaceOne: {
          filter: { _id: stock._id },
          replacement: stock,
          upsert: true
        }
      }));

      const result = await collection.bulkWrite(bulkOps);
      
      console.log('✅ Stock data saved to MongoDB successfully');
      console.log(`📊 Inserted: ${result.insertedCount}, Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}`);
      
      return {
        success: true,
        insertedCount: result.insertedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
        totalProcessed: enrichedStocks.length
      };

    } catch (error) {
      console.error('❌ Error saving stock data to MongoDB:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retrieve stock data from MongoDB
   */
  async getStockData(symbol = null, limit = null) {
    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) {
          throw new Error('Failed to connect to MongoDB');
        }
      }

      const collection = this.db.collection(this.collectionName);
      
      let query = {};
      if (symbol) {
        query._id = symbol.toUpperCase();
      }

      let cursor = collection.find(query);
      if (limit) {
        cursor = cursor.limit(limit);
      }

      const stocks = await cursor.toArray();
      
      if (symbol) {
        console.log(`📈 Retrieved ${stocks.length} stock(s) for symbol: ${symbol}`);
      } else {
        console.log(`📊 Retrieved ${stocks.length} total stocks from MongoDB`);
      }
      
      return {
        success: true,
        data: stocks,
        count: stocks.length
      };

    } catch (error) {
      console.error('❌ Error retrieving stock data from MongoDB:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get collection statistics
   */
  async getStats() {
    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) {
          throw new Error('Failed to connect to MongoDB');
        }
      }

      const collection = this.db.collection(this.collectionName);
      
      const totalDocs = await collection.countDocuments();
      const latestDoc = await collection.findOne({}, { sort: { lastUpdated: -1 } });
      const oldestDoc = await collection.findOne({}, { sort: { lastUpdated: 1 } });

      // Get top 5 most recently updated stocks
      const recentStocks = await collection
        .find({}, { projection: { symbol: 1, currentPrice: 1, lastUpdated: 1 } })
        .sort({ lastUpdated: -1 })
        .limit(5)
        .toArray();

      const stats = {
        totalStocks: totalDocs,
        latestUpdate: latestDoc ? latestDoc.lastUpdated : null,
        oldestUpdate: oldestDoc ? oldestDoc.lastUpdated : null,
        recentlyUpdated: recentStocks,
        collectionName: this.collectionName,
        databaseName: this.dbName
      };

      console.log('📊 MongoDB Collection Stats:', stats);
      return { success: true, stats };

    } catch (error) {
      console.error('❌ Error getting MongoDB stats:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete old stock data (cleanup)
   */
  async cleanupOldData(daysOld = 7) {
    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) {
          throw new Error('Failed to connect to MongoDB');
        }
      }

      const collection = this.db.collection(this.collectionName);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await collection.deleteMany({
        lastUpdated: { $lt: cutoffDate }
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old stock records (older than ${daysOld} days)`);
      
      return {
        success: true,
        deletedCount: result.deletedCount
      };

    } catch (error) {
      console.error('❌ Error cleaning up old data:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check for MongoDB connection
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Simple ping to check connection
      await this.db.admin().ping();

      return {
        status: 'healthy',
        connected: this.isConnected,
        database: this.dbName,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get top stocks by category sorted by stockScore
   * @param {string} category - 'large-cap', 'mid-cap', 'small-cap', or 'all'
   * @param {number} limit - Number of stocks to return (default: 10)
   * @returns {Promise<object>} Top stocks sorted by stockScore
   */
  async getTopStocksByCategory(category = 'all', limit = 10) {
    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) {
          throw new Error('Failed to connect to MongoDB');
        }
      }

      const collection = this.db.collection(this.collectionName);

      // Build query filter based on category
      let query = { stockScore: { $exists: true, $ne: null } };

      if (category !== 'all') {
        query.category = category;
      }

      // Query MongoDB, sort by stockScore descending, limit results
      const stocks = await collection
        .find(query)
        .sort({ stockScore: -1 })
        .limit(limit)
        .toArray();

      console.log(`📈 Retrieved ${stocks.length} top ${category} stocks sorted by stockScore`);

      return {
        success: true,
        category: category,
        limit: limit,
        stocks: stocks.map(stock => ({
          symbol: stock.symbol,
          companyName: stock.companyName,
          category: stock.category,
          currentPrice: stock.currentPrice,
          marketCapCrores: stock.marketCapCrores,
          stockScore: stock.stockScore,
          scoreMetrics: stock.scoreMetrics,
          recommendationKey: stock.recommendationKey
        })),
        count: stocks.length
      };

    } catch (error) {
      console.error('❌ Error getting top stocks by category:', error.message);
      return {
        success: false,
        error: error.message,
        stocks: []
      };
    }
  }

  /**
   * Get stock recommendations for portfolio allocation
   * @param {number} amount - Investment amount
   * @param {object} allocation - { largeCap: 30, midCap: 40, smallCap: 30 }
   * @param {number} topN - Number of stocks per category (default: 3)
   * @returns {Promise<object>} Portfolio recommendations
   */
  async getPortfolioRecommendations(amount, allocation, topN = 3) {
    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) {
          throw new Error('Failed to connect to MongoDB');
        }
      }

      console.log(`💼 Generating portfolio for ₹${amount} with allocation:`, allocation);

      // Get top stocks for each category
      const largeCapStocks = await this.getTopStocksByCategory('large-cap', topN);
      const midCapStocks = await this.getTopStocksByCategory('mid-cap', topN);
      const smallCapStocks = await this.getTopStocksByCategory('small-cap', topN);

      // Calculate amounts for each category
      const largeCapAmount = Math.floor(amount * allocation.largeCap / 100);
      const midCapAmount = Math.floor(amount * allocation.midCap / 100);
      const smallCapAmount = Math.floor(amount * allocation.smallCap / 100);

      // Calculate per-stock allocation
      const largeCapPerStock = largeCapStocks.stocks.length > 0 ? Math.floor(largeCapAmount / largeCapStocks.stocks.length) : 0;
      const midCapPerStock = midCapStocks.stocks.length > 0 ? Math.floor(midCapAmount / midCapStocks.stocks.length) : 0;
      const smallCapPerStock = smallCapStocks.stocks.length > 0 ? Math.floor(smallCapAmount / smallCapStocks.stocks.length) : 0;

      // Enrich stocks with allocation details
      const enrichLargeCap = largeCapStocks.stocks.map(stock => ({
        ...stock,
        amount: largeCapPerStock,
        shares: stock.currentPrice > 0 ? Math.floor(largeCapPerStock / stock.currentPrice) : 0
      }));

      const enrichMidCap = midCapStocks.stocks.map(stock => ({
        ...stock,
        amount: midCapPerStock,
        shares: stock.currentPrice > 0 ? Math.floor(midCapPerStock / stock.currentPrice) : 0
      }));

      const enrichSmallCap = smallCapStocks.stocks.map(stock => ({
        ...stock,
        amount: smallCapPerStock,
        shares: stock.currentPrice > 0 ? Math.floor(smallCapPerStock / stock.currentPrice) : 0
      }));

      console.log(`✅ Portfolio generated: ${enrichLargeCap.length} large-cap, ${enrichMidCap.length} mid-cap, ${enrichSmallCap.length} small-cap`);

      return {
        success: true,
        totalAmount: amount,
        allocation: allocation,
        largeCap: enrichLargeCap,
        midCap: enrichMidCap,
        smallCap: enrichSmallCap,
        summary: {
          totalStocks: enrichLargeCap.length + enrichMidCap.length + enrichSmallCap.length,
          largeCapAmount: largeCapAmount,
          midCapAmount: midCapAmount,
          smallCapAmount: smallCapAmount
        }
      };

    } catch (error) {
      console.error('❌ Error generating portfolio recommendations:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = MongoDBService;