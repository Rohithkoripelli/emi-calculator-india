/**
 * Test the scheduler functionality locally
 */

const scheduler = require('./daily-scheduler-2am');

async function testScheduler() {
  console.log('🧪 Testing scheduler functionality...');
  
  try {
    // Test immediate execution
    console.log('⚡ Testing immediate update...');
    await scheduler.runImmediateUpdate();
    
    console.log('✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testScheduler();