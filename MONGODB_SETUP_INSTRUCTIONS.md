# MongoDB Setup Instructions for Intelligent Portfolio System

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB** (v5.0 or higher)
3. **npm** or **yarn** package manager

## 🔧 MongoDB Installation

### Option 1: Local MongoDB Installation

#### On macOS:
```bash
# Install MongoDB using Homebrew
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
```

#### On Ubuntu/Debian:
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### On Windows:
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. MongoDB will start automatically as a Windows service

### Option 2: MongoDB Atlas (Cloud)

1. Go to https://cloud.mongodb.com
2. Sign up for a free account
3. Create a new cluster (Free tier available)
4. Get your connection string from the "Connect" button
5. Replace the connection string in your environment variables

## 📦 Install Required Dependencies

Add MongoDB driver to your project:

```bash
npm install mongodb
# or
yarn add mongodb
```

## ⚙️ Environment Configuration

1. **Copy the environment template:**
```bash
cp env.example .env
```

2. **Configure your MongoDB connection:**
```env
# For Local MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=intelligent_portfolio

# For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=intelligent_portfolio

# Optional: Custom configuration
SCREENER_RATE_LIMIT_MS=6000
GROWW_RATE_LIMIT_MS=100
DAILY_SCREENER_LIMIT=500
ENABLE_DATA_SCHEDULER=true
```

## 🚀 Initialize the System

### Method 1: Using the Initialization Script

```bash
# Compile TypeScript (if needed)
npx tsc

# Run the initialization script
node dist/src/scripts/initializeIntelligentSystem.js
```

### Method 2: Programmatic Initialization

```typescript
import IntelligentSystemInitializer from './src/scripts/initializeIntelligentSystem';

// Initialize with all features
const result = await IntelligentSystemInitializer.initialize({
  connectMongoDB: true,
  initializeData: true,
  startScheduler: true,
  seedSampleData: true  // Optional: Add sample stocks for testing
});

if (result.success) {
  console.log('✅ System ready for use!');
} else {
  console.log('❌ Initialization failed:', result.errors);
}
```

## 📊 Data Fetching Schedule

Once initialized, the system will automatically:

### 🔄 **Price Updates (Every Hour)**
- Fetches real-time prices from Groww API
- Updates 50 stocks per run to respect rate limits
- 100ms delay between API calls

### 📈 **Fundamental Updates (Every 24 Hours)**  
- Fetches financial metrics from Screener.in
- Updates 20 stocks per run (rate limited)
- 6-second delay between calls (10 symbols/minute limit)
- Daily quota of 500 calls

### 🎯 **Smart Scheduling**
- Prioritizes stocks with stale data
- Respects API rate limits automatically
- Handles errors gracefully with retries
- Comprehensive logging and monitoring

## 🧪 Testing the Setup

### 1. **Health Check**
```typescript
import IntelligentSystemInitializer from './src/scripts/initializeIntelligentSystem';

const health = await IntelligentSystemInitializer.healthCheck();
console.log('System health:', health.status);
```

### 2. **Generate Test Recommendations**
```typescript
import { PortfolioAllocationService } from './src/services/portfolioAllocationService';

const recommendations = await PortfolioAllocationService.generateIntelligentRecommendations(30000, 'LUMP_SUM');
console.log('Conservative strategy:', recommendations.conservative);
```

### 3. **Check Database Status**
```typescript
import StockDatabaseService from './src/services/stockDatabaseService';

const stats = await StockDatabaseService.getStats();
console.log('Database stats:', stats);
```

## 📈 Usage Examples

### **Manual Data Updates**
```typescript
import DataScheduler from './src/services/dataScheduler';

const scheduler = DataScheduler.getInstance();

// Trigger immediate price update
await scheduler.triggerImmediateUpdate('prices');

// Trigger immediate fundamental update
await scheduler.triggerImmediateUpdate('fundamentals');

// Get scheduler status
const status = scheduler.getStatus();
console.log('Next price update:', status.nextPriceUpdate);
```

### **Custom Portfolio Generation**
```typescript
import IntelligentPortfolioEngine from './src/services/intelligentPortfolioEngine';

// Generate custom allocation
const recommendation = await IntelligentPortfolioEngine.generateRecommendation({
  totalAmount: 50000,
  allocations: { largeCap: 40, midCap: 35, smallCap: 25 },
  maxStocksPerCategory: 5,
  riskTolerance: 'MEDIUM'
});

console.log('Custom portfolio:', recommendation);
```

## 🔍 Monitoring & Debugging

### **Database Collections**
The system creates 3 main collections:
- `stocks` - Stock data with prices and fundamentals
- `indices` - NSE/BSE index classifications
- `update_logs` - API call logs and performance metrics

### **Useful MongoDB Queries**
```javascript
// View all stocks with fundamentals
db.stocks.find({ "fundamentals": { "$exists": true, "$ne": {} } }).count()

// Check recent price updates
db.stocks.find({ "lastPriceUpdate": { "$gte": new Date(Date.now() - 3600000) } }).count()

// View update logs
db.update_logs.find().sort({ "startTime": -1 }).limit(10)

// Check stocks by market cap category
db.stocks.aggregate([
  { "$group": { "_id": "$marketCapCategory", "count": { "$sum": 1 } } }
])
```

## ⚠️ Troubleshooting

### **Common Issues**

1. **MongoDB Connection Failed**
   - Check if MongoDB service is running: `brew services list | grep mongodb`
   - Verify connection string in `.env` file
   - Ensure database name is correct

2. **Rate Limit Errors (429)**
   - System has built-in rate limiting
   - Check daily quotas: Screener.in limited to 500 calls/day
   - Monitor rate limit stats: `scheduler.getStatus().rateLimitStats`

3. **No Stock Data**
   - Run initialization script with `seedSampleData: true`
   - Check if indices are populated: `db.indices.find().count()`
   - Manually trigger data fetch: `scheduler.triggerImmediateUpdate('both')`

4. **Scheduler Not Running**
   - Check configuration: `ENABLE_DATA_SCHEDULER=true`
   - Verify scheduler status: `scheduler.getStatus().isRunning`
   - Check for initialization errors in logs

### **Performance Optimization**

1. **Database Indexes** (Auto-created)
   - Compound indexes on market cap and sector
   - Date indexes for efficient time-based queries
   - Text indexes for symbol searches

2. **Memory Usage**
   - Connection pooling: Max 10 connections
   - Query result caching for frequently accessed data
   - Automatic cleanup of old logs (keeps last 100)

## 🎯 Expected Performance

With proper setup, you should see:

- **Data Freshness**: 95%+ stocks with recent data
- **API Success Rate**: 90%+ for price updates, 85%+ for fundamentals
- **Response Time**: <200ms for portfolio generation
- **Memory Usage**: <100MB for typical workloads
- **Storage**: ~1MB per 1000 stocks with full data

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **MongoDB Access**: Use authentication in production
3. **API Keys**: Rotate regularly if using external APIs
4. **Rate Limiting**: Built-in protection against API abuse
5. **Data Validation**: All inputs are sanitized and validated

---

## ✅ Ready for Production!

Once setup is complete, the intelligent portfolio system will:

✅ **Automatically fetch** fresh stock data every hour
✅ **Update fundamentals** daily with rate limiting
✅ **Generate intelligent recommendations** using real-time data
✅ **Scale efficiently** with MongoDB's robust architecture
✅ **Handle errors gracefully** with comprehensive logging
✅ **Respect API limits** with conservative rate limiting

Your system is now ready to provide high-quality, data-driven portfolio recommendations! 🚀