#!/usr/bin/env node

/**
 * Test script for Groww Token Automation
 * Helps debug and test the automation process in development
 */

const GrowwTokenAutomation = require('./groww-token-automation');

class AutomationTester {
  constructor() {
    this.testMode = process.env.TEST_MODE === 'true';
  }

  async runDryRun() {
    console.log('🧪 Running Groww Token Automation Test (Dry Run)');
    console.log('=' .repeat(50));
    
    try {
      // Override config for testing
      const originalUpdateVercel = GrowwTokenAutomation.prototype.updateVercelEnvironment;
      
      GrowwTokenAutomation.prototype.updateVercelEnvironment = async function(token) {
        console.log('🔄 [DRY RUN] Would update Vercel with token:', token.substring(0, 50) + '...');
        console.log('🔄 [DRY RUN] Vercel Project ID:', this.config.vercelProjectId);
        console.log('🔄 [DRY RUN] Skipping actual API call in test mode');
        return Promise.resolve();
      };

      const automation = new GrowwTokenAutomation();
      
      // Run with test configuration
      automation.config.headless = false; // Show browser for debugging
      
      const result = await automation.run();
      
      // Restore original method
      GrowwTokenAutomation.prototype.updateVercelEnvironment = originalUpdateVercel;
      
      console.log('\n🎯 Test Result:', JSON.stringify(result, null, 2));
      
      return result.success;

    } catch (error) {
      console.error('❌ Test failed:', error);
      return false;
    }
  }

  async testConfiguration() {
    console.log('🔧 Testing Configuration...');
    console.log('=' .repeat(30));
    
    const required = {
      'GROWW_GOOGLE_EMAIL': process.env.GROWW_GOOGLE_EMAIL,
      'GROWW_GOOGLE_PASSWORD': process.env.GROWW_GOOGLE_PASSWORD ? '***hidden***' : undefined,
      'GROWW_PIN': process.env.GROWW_PIN ? '***hidden***' : undefined,
      'VERCEL_TOKEN': process.env.VERCEL_TOKEN ? '***hidden***' : undefined,
      'VERCEL_PROJECT_ID': process.env.VERCEL_PROJECT_ID
    };

    let allConfigured = true;

    for (const [key, value] of Object.entries(required)) {
      const status = value ? '✅' : '❌';
      console.log(`${status} ${key}: ${value || 'NOT SET'}`);
      
      if (!value) {
        allConfigured = false;
      }
    }

    console.log('\n📋 Configuration Summary:');
    console.log(`Overall Status: ${allConfigured ? '✅ All configured' : '❌ Missing variables'}`);
    
    if (!allConfigured) {
      console.log('\n💡 Setup Instructions:');
      console.log('1. Create a .env file in the automation directory');
      console.log('2. Add the missing environment variables');
      console.log('3. Get your credentials from:');
      console.log('   - Google: Your Gmail credentials');
      console.log('   - Groww: Your login PIN');
      console.log('   - Vercel: Your project token and ID');
    }

    return allConfigured;
  }

  async testVercelAPI() {
    console.log('🔗 Testing Vercel API Connection...');
    console.log('=' .repeat(30));
    
    try {
      const axios = require('axios');
      
      const vercelToken = process.env.VERCEL_TOKEN;
      const vercelProjectId = process.env.VERCEL_PROJECT_ID;
      
      if (!vercelToken || !vercelProjectId) {
        console.log('❌ Vercel credentials not configured');
        return false;
      }

      // Test API connection
      const response = await axios.get(`https://api.vercel.com/v9/projects/${vercelProjectId}`, {
        headers: {
          'Authorization': `Bearer ${vercelToken}`
        }
      });

      if (response.status === 200) {
        console.log('✅ Vercel API connection successful');
        console.log(`📝 Project: ${response.data.name}`);
        return true;
      }

    } catch (error) {
      console.error('❌ Vercel API test failed:', error.response?.data || error.message);
      return false;
    }
  }

  async testBrowser() {
    console.log('🌐 Testing Browser Automation...');
    console.log('=' .repeat(30));
    
    try {
      const puppeteer = require('puppeteer');
      
      console.log('🚀 Launching browser...');
      const browser = await puppeteer.launch({ 
        headless: false,
        devtools: true
      });
      
      const page = await browser.newPage();
      
      console.log('📱 Navigating to Groww...');
      await page.goto('https://groww.in', { waitUntil: 'networkidle2' });
      
      const title = await page.title();
      console.log(`📄 Page title: ${title}`);
      
      // Take a screenshot
      await page.screenshot({ path: 'test-groww-homepage.png' });
      console.log('📸 Screenshot saved: test-groww-homepage.png');
      
      await browser.close();
      console.log('✅ Browser test completed successfully');
      return true;

    } catch (error) {
      console.error('❌ Browser test failed:', error);
      return false;
    }
  }

  async runAllTests() {
    console.log('🧪 Running All Automation Tests');
    console.log('='.repeat(50));
    
    const tests = [
      { name: 'Configuration', fn: () => this.testConfiguration() },
      { name: 'Vercel API', fn: () => this.testVercelAPI() },
      { name: 'Browser', fn: () => this.testBrowser() }
    ];

    const results = {};
    
    for (const test of tests) {
      console.log(`\n🔍 Running ${test.name} test...`);
      try {
        results[test.name] = await test.fn();
      } catch (error) {
        console.error(`❌ ${test.name} test failed:`, error);
        results[test.name] = false;
      }
    }

    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(30));
    
    for (const [testName, passed] of Object.entries(results)) {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${testName}`);
    }

    const allPassed = Object.values(results).every(result => result);
    
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n🚀 Ready to run full automation!');
      console.log('   Use: npm start');
    } else {
      console.log('\n🔧 Fix the failing tests before running automation');
    }
    
    return allPassed;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  const tester = new AutomationTester();
  
  switch (command) {
    case 'config':
      await tester.testConfiguration();
      break;
    case 'vercel':
      await tester.testVercelAPI();
      break;
    case 'browser':
      await tester.testBrowser();
      break;
    case 'dryrun':
      await tester.runDryRun();
      break;
    case 'all':
    default:
      await tester.runAllTests();
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AutomationTester;