/**
 * Setup Intelligent Portfolio System with MongoDB Atlas
 * Complete system initialization using your cloud database
 */

const { MongoClient } = require('mongodb');

const ATLAS_URI = 'mongodb+srv://reddyrohith705:jehu5yDOINJIMNoI@cluster0.hgipoar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'intelligent_portfolio';

async function setupAtlasSystem() {
  console.log('🚀 Setting up Intelligent Portfolio System with MongoDB Atlas');
  console.log('=' .repeat(70));
  
  let client;
  
  try {
    // Step 1: Connect to Atlas
    console.log('\n📊 Step 1: Connecting to MongoDB Atlas...');
    
    client = new MongoClient(ATLAS_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority'
    });

    await client.connect();
    const db = client.db(DB_NAME);
    await db.admin().ping();
    
    console.log(`✅ Connected to Atlas cluster: ${DB_NAME}`);

    // Step 2: Setup Collections and Indexes
    console.log('\n🔧 Step 2: Setting up collections and indexes...');
    
    const collections = ['stocks', 'indices', 'update_logs'];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`   ✓ Created collection: ${collectionName}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ✓ Collection already exists: ${collectionName}`);
        } else {
          throw error;
        }
      }
    }

    // Create indexes for optimal performance
    console.log('\n📈 Creating performance indexes...');
    
    const stocksCollection = db.collection('stocks');
    const indicesCollection = db.collection('indices');
    const logsCollection = db.collection('update_logs');

    // Stocks collection indexes (skip _id as it's automatic)
    await stocksCollection.createIndex({ "marketCapCategory": 1 });
    await stocksCollection.createIndex({ "sector": 1 });
    await stocksCollection.createIndex({ "qualityScore": -1 });
    await stocksCollection.createIndex({ "lastPriceUpdate": 1 });
    await stocksCollection.createIndex({ "lastFundamentalUpdate": 1 });
    await stocksCollection.createIndex({ "indices": 1 });
    console.log('   ✓ Stocks collection indexes created');

    // Indices collection indexes (skip _id as it's automatic)
    await indicesCollection.createIndex({ "category": 1 });
    console.log('   ✓ Indices collection indexes created');

    // Update logs collection indexes
    await logsCollection.createIndex({ "startTime": -1 });
    await logsCollection.createIndex({ "type": 1 });
    await logsCollection.createIndex({ "status": 1 });
    console.log('   ✓ Update logs collection indexes created');

    // Step 3: Initialize Index Data
    console.log('\n📊 Step 3: Initializing stock indices...');
    
    const indexData = [
      {
        _id: 'NIFTY50',
        name: 'Nifty 50',
        category: 'LARGE_CAP',
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
        category: 'MID_CAP',
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
        category: 'SMALL_CAP',
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

    // Insert index data
    for (const index of indexData) {
      try {
        await indicesCollection.replaceOne(
          { _id: index._id }, 
          index, 
          { upsert: true }
        );
        console.log(`   ✓ Initialized ${index.name} (${index.totalStocks} stocks)`);
      } catch (error) {
        console.error(`   ✗ Failed to initialize ${index.name}:`, error.message);
      }
    }

    // Step 4: Add Sample Stock Data
    console.log('\n🌱 Step 4: Adding sample stock data...');
    
    const sampleStocks = [
      {
        _id: 'RELIANCE',
        name: 'Reliance Industries Limited',
        sector: 'Energy & Petrochemicals',
        marketCapCategory: 'LARGE_CAP',
        price: 2456.75,
        dayChange: 45.50,
        dayChangePercent: 1.89,
        volume: 2547896,
        fundamentals: {
          peRatio: 15.2,
          roe: 18.5,
          roce: 16.8,
          debtToEquity: 0.3,
          revenueGrowth: 12.5,
          profitGrowth: 15.2,
          dividendYield: 2.1,
          currentRatio: 1.2,
          eps: 125.5,
          bookValue: 850.2,
          marketCap: '₹15.2 L Cr',
          faceValue: 10
        },
        qualityScore: 0.85,
        lastPriceUpdate: new Date(),
        lastFundamentalUpdate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        indices: ['NIFTY50']
      },
      {
        _id: 'INFY',
        name: 'Infosys Limited',
        sector: 'Information Technology',
        marketCapCategory: 'LARGE_CAP',
        price: 1689.45,
        dayChange: -12.30,
        dayChangePercent: -0.72,
        volume: 1854762,
        fundamentals: {
          peRatio: 22.3,
          roe: 25.6,
          roce: 28.2,
          debtToEquity: 0.1,
          revenueGrowth: 8.9,
          profitGrowth: 12.4,
          dividendYield: 2.8,
          currentRatio: 2.1,
          eps: 68.9,
          bookValue: 245.6,
          marketCap: '₹6.8 L Cr',
          faceValue: 5
        },
        qualityScore: 0.92,
        lastPriceUpdate: new Date(),
        lastFundamentalUpdate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        indices: ['NIFTY50']
      },
      {
        _id: 'HDFCBANK',
        name: 'HDFC Bank Limited',
        sector: 'Banking & Finance',
        marketCapCategory: 'LARGE_CAP',
        price: 1687.30,
        dayChange: 28.75,
        dayChangePercent: 1.73,
        volume: 3247891,
        fundamentals: {
          peRatio: 18.5,
          roe: 17.2,
          roce: 19.5,
          debtToEquity: 0.8,
          revenueGrowth: 15.8,
          profitGrowth: 18.6,
          dividendYield: 1.2,
          currentRatio: 1.8,
          eps: 91.2,
          bookValue: 520.8,
          marketCap: '₹9.3 L Cr',
          faceValue: 1
        },
        qualityScore: 0.88,
        lastPriceUpdate: new Date(),
        lastFundamentalUpdate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        indices: ['NIFTY50']
      }
    ];

    for (const stock of sampleStocks) {
      try {
        await stocksCollection.replaceOne(
          { _id: stock._id }, 
          stock, 
          { upsert: true }
        );
        console.log(`   ✓ Added ${stock._id} (${stock.name})`);
      } catch (error) {
        console.error(`   ✗ Failed to add ${stock._id}:`, error.message);
      }
    }

    // Step 5: Verify Setup
    console.log('\n✅ Step 5: Verifying setup...');
    
    const finalStats = {
      indices: await indicesCollection.countDocuments(),
      stocks: await stocksCollection.countDocuments(),
      stocksWithPrices: await stocksCollection.countDocuments({ price: { $gt: 0 } }),
      stocksWithFundamentals: await stocksCollection.countDocuments({ fundamentals: { $exists: true, $ne: {} } })
    };

    console.log('📊 Final Database Status:');
    console.log(`   Indices: ${finalStats.indices}`);
    console.log(`   Total stocks: ${finalStats.stocks}`);
    console.log(`   Stocks with prices: ${finalStats.stocksWithPrices}`);
    console.log(`   Stocks with fundamentals: ${finalStats.stocksWithFundamentals}`);

    console.log('\n🎉 Atlas Setup Complete!');
    console.log('=' .repeat(50));
    console.log('✅ MongoDB Atlas database is ready');
    console.log('✅ Collections and indexes created');
    console.log('✅ Sample stock data loaded');
    console.log('✅ System ready for intelligent portfolio recommendations');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Copy env.atlas to .env (or set environment variables)');
    console.log('2. Run: npm install mongodb');
    console.log('3. Start the system: npm run start-intelligent-system');
    console.log('4. Generate portfolio: call PortfolioAllocationService.generateIntelligentRecommendations()');

  } catch (error) {
    console.error('\n❌ Atlas Setup Failed:', error.message);
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication troubleshooting:');
      console.error('   - Verify username/password in connection string');
      console.error('   - Check database user permissions in Atlas console');
      console.error('   - Ensure IP whitelist includes your current IP');
    }
    
    process.exit(1);
    
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Connection closed');
    }
  }
}

// Run the setup
setupAtlasSystem()
  .then(() => {
    console.log('\n✅ Atlas setup completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });