/**
 * MongoDB Connection Configuration
 * Handles database connection, collections setup, and error management
 */

import { MongoClient, Db, Collection } from 'mongodb';
import { StockDocument, IndexDocument, DataUpdateLog } from '../services/stockDataModels';

interface DatabaseConfig {
  uri: string;
  dbName: string;
  collections: {
    stocks: string;
    indices: string;
    updateLogs: string;
  };
}

class MongoDBConnection {
  private static instance: MongoDBConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: DatabaseConfig;

  private constructor() {
    this.config = {
      uri: process.env.MONGODB_URI || 'mongodb+srv://reddyrohith705:jehu5yDOINJIMNoI@cluster0.hgipoar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      dbName: process.env.MONGODB_DB_NAME || 'intelligent_portfolio',
      collections: {
        stocks: 'stocks',
        indices: 'indices',
        updateLogs: 'update_logs'
      }
    };
  }

  static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    try {
      if (this.client && this.db) {
        console.log('✅ MongoDB already connected');
        return;
      }

      const maskedUri = this.config.uri.replace(/:([^:@]+)@/, ':****@');
      console.log(`🔌 Connecting to MongoDB Atlas at ${maskedUri}...`);
      
      this.client = new MongoClient(this.config.uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000, // Increased for cloud
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        retryWrites: true,
        w: 'majority'
      });

      await this.client.connect();
      this.db = this.client.db(this.config.dbName);

      // Test the connection
      await this.db.admin().ping();
      console.log(`✅ Connected to MongoDB database: ${this.config.dbName}`);

      // Setup collections and indexes
      await this.setupCollections();

    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw new Error(`Failed to connect to MongoDB: ${error}`);
    }
  }

  /**
   * Setup collections and create indexes for optimal performance
   */
  private async setupCollections(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    try {
      // Create stocks collection with indexes
      const stocksCollection = this.db.collection(this.config.collections.stocks);
      await stocksCollection.createIndex({ "_id": 1 }, { unique: true });
      await stocksCollection.createIndex({ "marketCapCategory": 1 });
      await stocksCollection.createIndex({ "sector": 1 });
      await stocksCollection.createIndex({ "qualityScore": -1 });
      await stocksCollection.createIndex({ "lastPriceUpdate": 1 });
      await stocksCollection.createIndex({ "lastFundamentalUpdate": 1 });
      await stocksCollection.createIndex({ "indices": 1 });

      // Create indices collection with indexes  
      const indicesCollection = this.db.collection(this.config.collections.indices);
      await indicesCollection.createIndex({ "_id": 1 }, { unique: true });
      await indicesCollection.createIndex({ "category": 1 });

      // Create update logs collection with indexes
      const logsCollection = this.db.collection(this.config.collections.updateLogs);
      await logsCollection.createIndex({ "startTime": -1 });
      await logsCollection.createIndex({ "type": 1 });
      await logsCollection.createIndex({ "status": 1 });

      console.log('✅ MongoDB collections and indexes created successfully');

    } catch (error) {
      console.error('❌ Error setting up collections:', error);
      throw error;
    }
  }

  /**
   * Get database instance
   */
  getDatabase(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Get stocks collection
   */
  getStocksCollection(): Collection<StockDocument> {
    return this.getDatabase().collection<StockDocument>(this.config.collections.stocks);
  }

  /**
   * Get indices collection
   */
  getIndicesCollection(): Collection<IndexDocument> {
    return this.getDatabase().collection<IndexDocument>(this.config.collections.indices);
  }

  /**
   * Get update logs collection
   */
  getUpdateLogsCollection(): Collection<DataUpdateLog> {
    return this.getDatabase().collection<DataUpdateLog>(this.config.collections.updateLogs);
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        console.log('✅ Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }

  /**
   * Get connection status and stats
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    database: string;
    collections: string[];
    stats?: any;
  }> {
    try {
      if (!this.isConnected()) {
        return {
          connected: false,
          database: this.config.dbName,
          collections: []
        };
      }

      const db = this.getDatabase();
      const collections = await db.listCollections().toArray();
      const stats = await db.stats();

      return {
        connected: true,
        database: this.config.dbName,
        collections: collections.map(c => c.name),
        stats: {
          collections: stats.collections,
          dataSize: stats.dataSize,
          storageSize: stats.storageSize,
          indexes: stats.indexes
        }
      };

    } catch (error) {
      console.error('❌ Error getting connection status:', error);
      return {
        connected: false,
        database: this.config.dbName,
        collections: []
      };
    }
  }

  /**
   * Initialize database with sample data if empty
   */
  async initializeDatabase(): Promise<void> {
    try {
      console.log('🚀 Initializing database with sample data...');
      
      const indicesCollection = this.getIndicesCollection();
      const stocksCollection = this.getStocksCollection();

      // Check if already initialized
      const indexCount = await indicesCollection.countDocuments();
      if (indexCount > 0) {
        console.log('✅ Database already initialized');
        return;
      }

      // Initialize with index data (same as mock data)
      const indices = [
        {
          _id: 'NIFTY50',
          name: 'Nifty 50',
          category: 'LARGE_CAP' as const,
          description: 'Top 50 companies by market capitalization',
          stocks: [
            'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 
            'KOTAKBANK', 'LT', 'ITC', 'SBIN', 'BHARTIARTL', 'ASIANPAINT',
            'AXISBANK', 'MARUTI', 'BAJFINANCE', 'HCLTECH', 'M&M', 'SUNPHARMA',
            'TITAN', 'NESTLEIND', 'BAJAJFINSV', 'ULTRACEMCO', 'WIPRO', 'ONGC',
            'TECHM', 'POWERGRID', 'LTIM', 'NTPC', 'JSWSTEEL', 'TATAMOTORS',
            'COALINDIA', 'GRASIM', 'HINDALCO', 'ADANIENT', 'INDUSINDBK',
            'HDFCLIFE', 'SBILIFE', 'BRITANNIA', 'TATACONSUM', 'DIVISLAB',
            'EICHERMOT', 'BPCL', 'CIPLA', 'APOLLOHOSP', 'HEROMOTOCO',
            'DRREDDY', 'UPL', 'BAJAJ-AUTO', 'SHRIRAMFIN', 'GODREJCP'
          ],
          totalStocks: 50,
          lastUpdated: new Date()
        },
        {
          _id: 'NIFTYNEXT50',
          name: 'Nifty Next 50',
          category: 'MID_CAP' as const,
          description: 'Next 50 companies after Nifty 50',
          stocks: [
            'PIDILITIND', 'DABUR', 'MARICO', 'MCDOWELL-N', 'COLPAL', 'BERGEPAINT',
            'TRENT', 'PAGEIND', 'HAVELLS', 'VOLTAS', 'CUMMINSIND', 'MPHASIS',
            'PERSISTENT', 'COFORGE', 'MINDTREE', 'LICI', 'NMDC', 'SAIL',
            'VEDL', 'HINDZINC', 'AMBUJACEM', 'ACC', 'SHREECEM', 'RAMCOCEM',
            'JINDALSTEL', 'TATASTEEL', 'JSWENERGY', 'TORNTPHARM', 'LUPIN',
            'AUBANK', 'FEDERALBNK', 'IDFCFIRSTB', 'BANDHANBNK', 'PNB',
            'CANBK', 'IOC', 'GAIL', 'PETRONET', 'IGL', 'MGL', 'ATGL',
            'RECLTD', 'PFC', 'IRCTC', 'CONCOR', 'GMRINFRA', 'ADANIPORTS',
            'SIEMENS', 'ABB', 'BHEL', 'BEL'
          ],
          totalStocks: 50,
          lastUpdated: new Date()
        },
        {
          _id: 'NIFTYSMALLCAP100',
          name: 'Nifty SmallCap 100',
          category: 'SMALL_CAP' as const,
          description: 'Top 100 small-cap companies',
          stocks: [
            'TATAINVEST', 'CREDITACC', 'MANAPPURAM', 'UJJIVAN', 'CHOLAFIN',
            'MOTILALOFS', 'IIFL', 'ANGELONE', 'POLICYBZR', 'PAYTM',
            'ZOMATO', 'NYKAA', 'DELHIVERY', 'EASEMYTRIP', 'CARTRADE',
            'DEVYANI', 'BHARATFORG', 'ESCORTS', 'EXIDEIND', 'MOTHERSON',
            'ASHOKLEY', 'BALKRISIND', 'APOLLOTYRE', 'CEAT', 'MRF',
            'RELAXO', 'BATAINDIA', 'VBL', 'MARICO', 'GODREJIND',
            'HONAUT', 'THERMAX', 'CROMPTON', 'POLYCAB', 'FINOLEX',
            'ASTRAL', 'SUPREME', 'NILKAMAL', 'KANSAINER', 'SINTEX'
          ],
          totalStocks: 100,
          lastUpdated: new Date()
        }
      ];

      await indicesCollection.insertMany(indices);
      console.log(`✅ Initialized database with ${indices.length} indices and ${indices.reduce((sum, idx) => sum + idx.totalStocks, 0)} total stocks`);

    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    }
  }
}

export default MongoDBConnection;