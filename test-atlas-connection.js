/**
 * Test MongoDB Atlas Connection
 * Quick test to verify your Atlas cluster is accessible
 */

const { MongoClient } = require('mongodb');

const ATLAS_URI = 'mongodb+srv://reddyrohith705:jehu5yDOINJIMNoI@cluster0.hgipoar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'intelligent_portfolio';

async function testAtlasConnection() {
  console.log('🧪 Testing MongoDB Atlas Connection');
  console.log('=' .repeat(50));
  
  let client;
  
  try {
    console.log('\n🔌 Connecting to MongoDB Atlas...');
    
    client = new MongoClient(ATLAS_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    });

    await client.connect();
    console.log('✅ Connected to MongoDB Atlas successfully!');

    const db = client.db(DB_NAME);
    console.log(`✅ Database "${DB_NAME}" accessed successfully!`);

    // Test ping
    await db.admin().ping();
    console.log('✅ Ping test successful!');

    // List existing collections
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} existing collections:`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    // Test creating a collection (if none exist)
    if (collections.length === 0) {
      console.log('\n🔧 Creating test collection...');
      await db.createCollection('test_connection');
      
      // Insert a test document
      const testCollection = db.collection('test_connection');
      const result = await testCollection.insertOne({
        test: true,
        timestamp: new Date(),
        message: 'Atlas connection test successful'
      });
      console.log(`✅ Test document inserted with ID: ${result.insertedId}`);
      
      // Read it back
      const testDoc = await testCollection.findOne({ test: true });
      console.log('✅ Test document retrieved:', testDoc.message);
      
      // Clean up
      await testCollection.deleteOne({ _id: result.insertedId });
      await db.dropCollection('test_connection');
      console.log('✅ Test cleanup completed');
    }

    // Get database stats
    const stats = await db.stats();
    console.log('\n📈 Database Statistics:');
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Data Size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    console.log(`   Storage Size: ${(stats.storageSize / 1024).toFixed(2)} KB`);
    console.log(`   Indexes: ${stats.indexes}`);

    console.log('\n🎉 MongoDB Atlas Connection Test: SUCCESS');
    console.log('✅ Your Atlas cluster is ready for the intelligent portfolio system!');

  } catch (error) {
    console.error('\n❌ MongoDB Atlas Connection Test: FAILED');
    console.error('Error details:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Authentication Issue:');
      console.error('   - Check your username and password');
      console.error('   - Verify your IP address is whitelisted in Atlas');
      console.error('   - Ensure your user has proper database permissions');
    } else if (error.message.includes('connection')) {
      console.error('\n💡 Connection Issue:');
      console.error('   - Check your internet connection');
      console.error('   - Verify the cluster is not paused');
      console.error('   - Check if your IP is whitelisted (0.0.0.0/0 for all IPs)');
    }
    
    process.exit(1);
    
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Connection closed');
    }
  }
}

// Run the test
testAtlasConnection()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });