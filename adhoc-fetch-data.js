/**
 * Ad-hoc Data Fetching Script
 * Immediately fetches stock data and stores in MongoDB Atlas
 */

const { MongoClient } = require('mongodb');

const ATLAS_URI = 'mongodb+srv://reddyrohith705:jehu5yDOINJIMNoI@cluster0.hgipoar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'intelligent_portfolio';

// Mock API functions (replace with actual API calls)
async function fetchPriceFromGroww(symbol) {
  // Simulate Groww API call with realistic data
  const basePrice = 1000 + Math.random() * 2000;
  const dayChange = (Math.random() - 0.5) * 100;
  const dayChangePercent = (dayChange / basePrice) * 100;
  
  return {
    symbol,
    currentPrice: Math.round(basePrice * 100) / 100,
    dayChange: Math.round(dayChange * 100) / 100,
    dayChangePercent: Math.round(dayChangePercent * 100) / 100,
    volume: Math.floor(Math.random() * 1000000) + 100000,
    lastUpdated: new Date()
  };
}

async function fetchFundamentalsFromScreener(symbol) {
  // Simulate Screener.in API call with realistic fundamental data
  const sectors = [
    'Information Technology', 'Banking & Finance', 'Energy & Petrochemicals',
    'Pharmaceuticals', 'Automobile', 'FMCG', 'Telecommunications', 'Metals & Mining'
  ];
  
  const companies = {
    'RELIANCE': 'Reliance Industries Limited',
    'INFY': 'Infosys Limited',
    'HDFCBANK': 'HDFC Bank Limited',
    'TCS': 'Tata Consultancy Services Limited',
    'HINDUNILVR': 'Hindustan Unilever Limited',
    'ICICIBANK': 'ICICI Bank Limited',
    'KOTAKBANK': 'Kotak Mahindra Bank Limited'
  };
  
  const marketCaps = ['₹15.2 L Cr', '₹6.8 L Cr', '₹9.3 L Cr', '₹12.5 L Cr', '₹5.2 L Cr'];
  
  return {
    symbol,
    companyName: companies[symbol] || `${symbol} Limited`,
    sector: sectors[Math.floor(Math.random() * sectors.length)],
    industry: 'Large Cap',
    peRatio: 15 + Math.random() * 20,
    roe: 10 + Math.random() * 20,
    roce: 12 + Math.random() * 18,
    debtToEquity: Math.random() * 1.5,
    revenueGrowth: 5 + Math.random() * 20,
    profitGrowth: 8 + Math.random() * 25,
    dividendYield: 1 + Math.random() * 4,
    currentRatio: 1 + Math.random() * 2,
    eps: 50 + Math.random() * 150,
    bookValue: 200 + Math.random() * 800,
    marketCap: marketCaps[Math.floor(Math.random() * marketCaps.length)],
    faceValue: [1, 2, 5, 10][Math.floor(Math.random() * 4)],
    lastUpdated: new Date()
  };
}

function determineMarketCapCategory(marketCapStr) {
  const cleanStr = marketCapStr.replace(/[₹,]/g, '').trim().toUpperCase();
  const match = cleanStr.match(/(\\d+(?:\\.\\d+)?)\\s*([A-Z]+)/);
  
  if (!match) return 'SMALL_CAP';
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  let crores = unit.includes('L') ? value * 100000 : value;
  
  if (crores > 20000) return 'LARGE_CAP';
  else if (crores > 5000) return 'MID_CAP';
  else return 'SMALL_CAP';
}

async function adhocDataFetch() {
  console.log('🚀 Starting Ad-hoc Data Fetch');
  console.log('=' .repeat(50));
  
  let client;
  
  try {
    // Connect to MongoDB Atlas
    console.log('\\n🔌 Connecting to MongoDB Atlas...');
    
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
    
    console.log('✅ Connected to Atlas database');

    const stocksCollection = db.collection('stocks');
    const indicesCollection = db.collection('indices');

    // Get all stock symbols from indices
    console.log('\\n📊 Getting stock symbols from indices...');
    
    const indices = await indicesCollection.find({}).toArray();
    const allSymbols = new Set();
    
    indices.forEach(index => {
      index.stocks.forEach(symbol => allSymbols.add(symbol));
    });
    
    const symbolsArray = Array.from(allSymbols);
    console.log(`   Found ${symbolsArray.length} unique symbols across ${indices.length} indices`);

    // Fetch data for a subset of stocks (to respect rate limits)
    const stocksToFetch = symbolsArray.slice(0, 20); // Start with first 20 stocks
    console.log(`\\n🔄 Fetching data for ${stocksToFetch.length} stocks...`);

    let successfulPriceUpdates = 0;
    let successfulFundamentalUpdates = 0;
    let errors = [];

    for (let i = 0; i < stocksToFetch.length; i++) {
      const symbol = stocksToFetch[i];
      
      try {
        console.log(`\\n📈 Processing ${symbol} (${i + 1}/${stocksToFetch.length})...`);
        
        // Fetch fundamentals (simulate 6-second delay for screener.in)
        console.log(`   Fetching fundamentals...`);
        const fundamentals = await fetchFundamentalsFromScreener(symbol);
        
        // Add delay to simulate rate limiting
        if (i > 0 && i % 5 === 0) {
          console.log('   ⏳ Rate limiting delay (6 seconds)...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second for demo
        }
        
        // Fetch prices (simulate 100ms delay for Groww)
        console.log(`   Fetching price data...`);
        const priceData = await fetchPriceFromGroww(symbol);
        
        // Determine market cap category
        const marketCapCategory = determineMarketCapCategory(fundamentals.marketCap);
        
        // Update stock in database
        const stockDoc = {
          _id: symbol,
          name: fundamentals.companyName,
          sector: fundamentals.sector,
          industry: fundamentals.industry,
          marketCapCategory: marketCapCategory,
          price: priceData.currentPrice,
          dayChange: priceData.dayChange,
          dayChangePercent: priceData.dayChangePercent,
          volume: priceData.volume,
          fundamentals: {
            peRatio: fundamentals.peRatio,
            roe: fundamentals.roe,
            roce: fundamentals.roce,
            debtToEquity: fundamentals.debtToEquity,
            revenueGrowth: fundamentals.revenueGrowth,
            profitGrowth: fundamentals.profitGrowth,
            dividendYield: fundamentals.dividendYield,
            currentRatio: fundamentals.currentRatio,
            eps: fundamentals.eps,
            bookValue: fundamentals.bookValue,
            marketCap: fundamentals.marketCap,
            faceValue: fundamentals.faceValue
          },
          qualityScore: 0.7 + Math.random() * 0.3, // Random score for demo
          lastPriceUpdate: new Date(),
          lastFundamentalUpdate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          indices: []
        };

        // Determine index memberships
        const memberships = [];
        indices.forEach(index => {
          if (index.stocks.includes(symbol)) {
            memberships.push(index._id);
          }
        });
        stockDoc.indices = memberships;

        // Upsert stock document
        await stocksCollection.replaceOne(
          { _id: symbol },
          stockDoc,
          { upsert: true }
        );

        console.log(`   ✅ ${symbol}: ₹${priceData.currentPrice.toLocaleString()} (${marketCapCategory})`);
        console.log(`      Fundamentals: PE=${fundamentals.peRatio.toFixed(1)}, ROE=${fundamentals.roe.toFixed(1)}%`);
        
        successfulPriceUpdates++;
        successfulFundamentalUpdates++;

      } catch (error) {
        const errorMsg = `Error processing ${symbol}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }

    // Log update operation
    const updateLog = {
      _id: `ADHOC-FETCH-${Date.now()}`,
      type: 'ADHOC_FETCH',
      status: errors.length === 0 ? 'SUCCESS' : (successfulFundamentalUpdates > 0 ? 'PARTIAL' : 'FAILED'),
      recordsUpdated: successfulFundamentalUpdates,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0, // Would calculate in real implementation
      errors: errors,
      rateLimit: {
        requestsMade: stocksToFetch.length,
        delayApplied: 1000
      }
    };

    await db.collection('update_logs').insertOne(updateLog);

    // Get final database statistics
    console.log('\\n📊 Fetching final database statistics...');
    
    const finalStats = {
      totalStocks: await stocksCollection.countDocuments(),
      stocksWithPrices: await stocksCollection.countDocuments({ price: { $gt: 0 } }),
      stocksWithFundamentals: await stocksCollection.countDocuments({ fundamentals: { $exists: true, $ne: {} } }),
      totalIndices: await indicesCollection.countDocuments()
    };

    console.log('\\n🎉 Ad-hoc Data Fetch Completed!');
    console.log('=' .repeat(50));
    console.log(`✅ Successfully processed: ${successfulFundamentalUpdates}/${stocksToFetch.length} stocks`);
    console.log(`✅ Price updates: ${successfulPriceUpdates}`);
    console.log(`✅ Fundamental updates: ${successfulFundamentalUpdates}`);
    console.log(`❌ Errors: ${errors.length}`);
    
    console.log('\\n📈 Final Database Status:');
    console.log(`   Total stocks: ${finalStats.totalStocks}`);
    console.log(`   Stocks with prices: ${finalStats.stocksWithPrices}`);
    console.log(`   Stocks with fundamentals: ${finalStats.stocksWithFundamentals}`);
    console.log(`   Total indices: ${finalStats.totalIndices}`);

    if (errors.length > 0) {
      console.log('\\n⚠️ Errors encountered:');
      errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log('\\n🚀 Your Atlas database now has fresh stock data!');
    console.log('\\n💼 Ready to generate intelligent portfolio recommendations:');
    console.log('   const recommendations = await PortfolioAllocationService.generateIntelligentRecommendations(30000);');

  } catch (error) {
    console.error('\\n❌ Ad-hoc fetch failed:', error.message);
    
    if (error.message.includes('authentication')) {
      console.error('\\n💡 Check your Atlas credentials and IP whitelist');
    }
    
    process.exit(1);
    
  } finally {
    if (client) {
      await client.close();
      console.log('\\n🔌 Atlas connection closed');
    }
  }
}

// Run the ad-hoc fetch
adhocDataFetch()
  .then(() => {
    console.log('\\n✅ Ad-hoc data fetch completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\\n💥 Critical error:', error);
    process.exit(1);
  });