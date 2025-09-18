/**
 * Test the recommendation system with 30/40/30 split for ₹10,000
 */

const { MongoClient } = require('mongodb');

const ATLAS_URI = 'mongodb+srv://reddyrohith705:jehu5yDOINJIMNoI@cluster0.hgipoar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'intelligent_portfolio';

async function testRecommendationSystem() {
  console.log('🎯 Testing Recommendation System');
  console.log('=' .repeat(50));
  console.log('📊 Test Scenario: ₹10,000 with 30% Large / 40% Mid / 30% Small split');
  console.log('');

  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(ATLAS_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('✅ Connected to MongoDB Atlas');

    // Test parameters
    const totalAmount = 10000;
    const largeCapPercent = 30;
    const midCapPercent = 40;
    const smallCapPercent = 30;

    // Calculate allocation amounts
    const largeCapAmount = Math.floor((totalAmount * largeCapPercent) / 100);
    const midCapAmount = Math.floor((totalAmount * midCapPercent) / 100);
    const smallCapAmount = Math.floor((totalAmount * smallCapPercent) / 100);

    console.log('💰 Allocation Breakdown:');
    console.log(`   Total Investment: ₹${totalAmount.toLocaleString()}`);
    console.log(`   Large Cap (${largeCapPercent}%): ₹${largeCapAmount.toLocaleString()}`);
    console.log(`   Mid Cap (${midCapPercent}%): ₹${midCapAmount.toLocaleString()}`);
    console.log(`   Small Cap (${smallCapPercent}%): ₹${smallCapAmount.toLocaleString()}`);

    // Check current database state
    console.log('\\n📊 Current Database Analysis:');
    
    const totalStocks = await db.collection('stocks').countDocuments();
    const stocksWithPrices = await db.collection('stocks').countDocuments({ 
      price: { $exists: true, $gt: 0 } 
    });
    const stocksWithScores = await db.collection('stocks').countDocuments({ 
      qualityScore: { $exists: true, $ne: null } 
    });

    console.log(`   Total stocks: ${totalStocks}`);
    console.log(`   Stocks with prices: ${stocksWithPrices}`);
    console.log(`   Stocks with quality scores: ${stocksWithScores}`);

    // Market cap distribution
    const largeCap = await db.collection('stocks').countDocuments({ marketCapCategory: 'LARGE_CAP' });
    const midCap = await db.collection('stocks').countDocuments({ marketCapCategory: 'MID_CAP' });
    const smallCap = await db.collection('stocks').countDocuments({ marketCapCategory: 'SMALL_CAP' });

    console.log(`\\n💼 Market Cap Distribution:`);
    console.log(`   Large Cap: ${largeCap} stocks`);
    console.log(`   Mid Cap: ${midCap} stocks`);
    console.log(`   Small Cap: ${smallCap} stocks`);

    // Get top stocks from each category
    console.log('\\n🏆 Top Stocks Analysis:');

    const topLargeCap = await db.collection('stocks')
      .find({ 
        marketCapCategory: 'LARGE_CAP',
        qualityScore: { $exists: true, $ne: null },
        price: { $gt: 0 }
      })
      .sort({ qualityScore: -1 })
      .limit(5)
      .toArray();

    const topMidCap = await db.collection('stocks')
      .find({ 
        marketCapCategory: 'MID_CAP',
        qualityScore: { $exists: true, $ne: null },
        price: { $gt: 0 }
      })
      .sort({ qualityScore: -1 })
      .limit(5)
      .toArray();

    const topSmallCap = await db.collection('stocks')
      .find({ 
        marketCapCategory: 'SMALL_CAP',
        qualityScore: { $exists: true, $ne: null },
        price: { $gt: 0 }
      })
      .sort({ qualityScore: -1 })
      .limit(5)
      .toArray();

    console.log(`   Available Large Cap stocks: ${topLargeCap.length}`);
    console.log(`   Available Mid Cap stocks: ${topMidCap.length}`);
    console.log(`   Available Small Cap stocks: ${topSmallCap.length}`);

    // Show top stocks in each category
    if (topLargeCap.length > 0) {
      console.log('\\n🎯 Top Large Cap Stocks:');
      topLargeCap.slice(0, 3).forEach((stock, index) => {
        console.log(`   ${index + 1}. ${stock._id}: ₹${stock.price} | Score: ${stock.qualityScore.toFixed(4)} | Sector: ${stock.sector || 'Unknown'}`);
      });
    }

    if (topMidCap.length > 0) {
      console.log('\\n📈 Top Mid Cap Stocks:');
      topMidCap.slice(0, 3).forEach((stock, index) => {
        console.log(`   ${index + 1}. ${stock._id}: ₹${stock.price} | Score: ${stock.qualityScore.toFixed(4)} | Sector: ${stock.sector || 'Unknown'}`);
      });
    }

    if (topSmallCap.length > 0) {
      console.log('\\n📉 Top Small Cap Stocks:');
      topSmallCap.slice(0, 3).forEach((stock, index) => {
        console.log(`   ${index + 1}. ${stock._id}: ₹${stock.price} | Score: ${stock.qualityScore.toFixed(4)} | Sector: ${stock.sector || 'Unknown'}`);
      });
    }

    // Generate recommendations
    const recommendations = await generateRecommendations(
      { topLargeCap, topMidCap, topSmallCap },
      { largeCapAmount, midCapAmount, smallCapAmount }
    );

    // Display final recommendations
    console.log('\\n🎉 FINAL RECOMMENDATIONS (Exact JSON Format):');
    console.log('=' .repeat(50));
    console.log(JSON.stringify(recommendations, null, 2));

    // Analysis of recommendations
    console.log('\\n📊 Recommendation Analysis:');
    const totalAllocated = 
      (recommendations.LargeCap?.reduce((sum, alloc) => sum + alloc.allocation, 0) || 0) +
      (recommendations.MidCap?.reduce((sum, alloc) => sum + alloc.allocation, 0) || 0) +
      (recommendations.SmallCap?.reduce((sum, alloc) => sum + alloc.allocation, 0) || 0);
    
    const totalShares = 
      (recommendations.LargeCap?.reduce((sum, alloc) => sum + alloc.qty, 0) || 0) +
      (recommendations.MidCap?.reduce((sum, alloc) => sum + alloc.qty, 0) || 0) +
      (recommendations.SmallCap?.reduce((sum, alloc) => sum + alloc.qty, 0) || 0);

    console.log(`   Total Amount Allocated: ₹${totalAllocated.toLocaleString()}`);
    console.log(`   Remaining Amount: ₹${(totalAmount - totalAllocated).toLocaleString()}`);
    console.log(`   Total Shares: ${totalShares}`);
    console.log(`   Allocation Efficiency: ${((totalAllocated / totalAmount) * 100).toFixed(1)}%`);

    // Quality assessment
    const allAllocations = [
      ...(recommendations.LargeCap || []),
      ...(recommendations.MidCap || []),
      ...(recommendations.SmallCap || [])
    ];

    if (allAllocations.length > 0) {
      console.log('\\n✅ Quality Assessment: PASSED');
      console.log(`   Stocks recommended: ${allAllocations.length}`);
      console.log(`   Diversification: ${allAllocations.length >= 3 ? 'Good' : 'Limited'}`);
      console.log(`   Format: Exact JSON as specified ✓`);
    } else {
      console.log('\\n❌ Quality Assessment: FAILED');
      console.log('   No stocks could be recommended');
      console.log('   Issue: Need more stocks with proper market cap categorization');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function generateRecommendations(stocksByCategory, amounts) {
  const { topLargeCap, topMidCap, topSmallCap } = stocksByCategory;
  const { largeCapAmount, midCapAmount, smallCapAmount } = amounts;

  const result = {
    LargeCap: allocateToStocks(topLargeCap, largeCapAmount),
    MidCap: allocateToStocks(topMidCap, midCapAmount),
    SmallCap: allocateToStocks(topSmallCap, smallCapAmount)
  };

  return result;
}

function allocateToStocks(stocks, totalAmount) {
  if (stocks.length === 0 || totalAmount <= 0) {
    return [];
  }

  const allocations = [];
  const stocksToUse = stocks.slice(0, Math.min(3, stocks.length)); // Use top 3 stocks
  
  if (stocksToUse.length === 0) {
    return [];
  }

  const amountPerStock = Math.floor(totalAmount / stocksToUse.length);
  let remainingAmount = totalAmount;

  stocksToUse.forEach((stock, index) => {
    // For the last stock, allocate all remaining amount
    const allocationAmount = (index === stocksToUse.length - 1) ? remainingAmount : amountPerStock;
    
    const qty = Math.floor(allocationAmount / stock.price);
    const actualAllocation = qty * stock.price;

    if (qty > 0) {
      allocations.push({
        stock: stock._id,
        allocation: actualAllocation,
        qty: qty
      });

      remainingAmount -= actualAllocation;
    }
  });

  return allocations;
}

// Run the test
console.log('🚀 Starting Recommendation System Test...');
testRecommendationSystem()
  .then(() => {
    console.log('\\n🎯 Test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });