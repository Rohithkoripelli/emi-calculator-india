#!/usr/bin/env node

/**
 * Groww Token Automation Script
 * Automates daily token renewal using UI automation (Puppeteer)
 * 
 * Features:
 * - Google Sign-in automation
 * - PIN entry automation  
 * - Token generation automation
 * - Vercel environment variable update
 * - Comprehensive error handling and logging
 */

const puppeteer = require('puppeteer');
const axios = require('axios');

class GrowwTokenAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    
    // Environment variables
    this.config = {
      // Groww credentials
      googleEmail: process.env.GROWW_GOOGLE_EMAIL,
      googlePassword: process.env.GROWW_GOOGLE_PASSWORD,
      growwPin: process.env.GROWW_PIN,
      
      // Vercel API credentials
      vercelToken: process.env.VERCEL_TOKEN,
      vercelProjectId: process.env.VERCEL_PROJECT_ID,
      
      // Automation settings
      headless: process.env.NODE_ENV === 'production',
      timeout: 30000,
      
      // URLs
      growwLoginUrl: 'https://groww.in/login',
      growwTradingApisUrl: 'https://groww.in/user/profile/trading-apis'
    };
    
    this.validateConfig();
  }

  validateConfig() {
    const required = [
      'googleEmail', 'googlePassword', 'growwPin', 
      'vercelToken', 'vercelProjectId'
    ];
    
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    console.log('✅ Configuration validated');
  }

  async initialize() {
    console.log('🚀 Initializing Groww Token Automation...');
    
    try {
      // Launch browser
      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set viewport
      await this.page.setViewport({ width: 1366, height: 768 });
      
      console.log('✅ Browser initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      throw error;
    }
  }

  async loginToGroww() {
    console.log('🔐 Starting Groww login process...');
    
    try {
      // Navigate to Groww login page
      console.log('📱 Navigating to Groww login page...');
      await this.page.goto(this.config.growwLoginUrl, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });

      // Look for Google Sign-in button
      console.log('🔍 Looking for Google Sign-in button...');
      const googleSignInSelectors = [
        'button[data-testid="google-login"]',
        'button:contains("Continue with Google")',
        '.google-signin-button',
        '[aria-label*="Google"]',
        'button:contains("Google")'
      ];

      let googleButton = null;
      for (const selector of googleSignInSelectors) {
        try {
          googleButton = await this.page.waitForSelector(selector, { timeout: 5000 });
          if (googleButton) {
            console.log(`✅ Found Google Sign-in button: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!googleButton) {
        // Take screenshot for debugging
        await this.page.screenshot({ path: 'debug-login-page.png' });
        throw new Error('Google Sign-in button not found');
      }

      // Click Google Sign-in button
      console.log('👆 Clicking Google Sign-in button...');
      await googleButton.click();

      // Wait for Google login page to load
      console.log('⏳ Waiting for Google login page...');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Fill in Google email
      console.log('📧 Entering Google email...');
      const emailSelector = 'input[type="email"]';
      await this.page.waitForSelector(emailSelector);
      await this.page.type(emailSelector, this.config.googleEmail);
      
      // Click Next button
      console.log('➡️ Clicking Next button...');
      const nextButtonSelectors = [
        '#identifierNext',
        'button:contains("Next")',
        '[data-testid="next-button"]'
      ];
      
      for (const selector of nextButtonSelectors) {
        try {
          const nextButton = await this.page.$(selector);
          if (nextButton) {
            await nextButton.click();
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Wait for password field and enter password
      console.log('🔑 Entering Google password...');
      const passwordSelector = 'input[type="password"]';
      await this.page.waitForSelector(passwordSelector, { timeout: this.config.timeout });
      await this.page.type(passwordSelector, this.config.googlePassword);

      // Click Sign In button
      console.log('🔓 Clicking Sign In button...');
      const signInButtonSelectors = [
        '#passwordNext',
        'button:contains("Sign in")',
        '[data-testid="signin-button"]'
      ];
      
      for (const selector of signInButtonSelectors) {
        try {
          const signInButton = await this.page.$(selector);
          if (signInButton) {
            await signInButton.click();
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Wait for redirect back to Groww
      console.log('🔄 Waiting for redirect to Groww...');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: this.config.timeout });

      // Handle PIN entry if required
      await this.handlePinEntry();

      console.log('✅ Successfully logged into Groww');

    } catch (error) {
      console.error('❌ Login failed:', error);
      
      // Take screenshot for debugging
      await this.page.screenshot({ path: 'debug-login-error.png' });
      throw error;
    }
  }

  async handlePinEntry() {
    console.log('🔢 Checking if PIN entry is required...');
    
    try {
      // Look for PIN input field
      const pinSelectors = [
        'input[type="password"][maxlength="4"]',
        'input[type="password"][maxlength="6"]',
        'input[placeholder*="PIN"]',
        'input[placeholder*="pin"]',
        '.pin-input'
      ];

      let pinInput = null;
      for (const selector of pinSelectors) {
        try {
          pinInput = await this.page.waitForSelector(selector, { timeout: 5000 });
          if (pinInput) {
            console.log(`✅ Found PIN input: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (pinInput) {
        console.log('🔢 Entering PIN...');
        await this.page.type(pinInput, this.config.growwPin);

        // Look for submit button
        const submitSelectors = [
          'button[type="submit"]',
          'button:contains("Continue")',
          'button:contains("Submit")',
          'button:contains("Verify")'
        ];

        for (const selector of submitSelectors) {
          try {
            const submitButton = await this.page.$(selector);
            if (submitButton) {
              await submitButton.click();
              console.log('✅ PIN submitted');
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }

        // Wait for PIN verification
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      } else {
        console.log('ℹ️ No PIN entry required');
      }

    } catch (error) {
      console.error('❌ PIN entry failed:', error);
      // Don't throw here as PIN might not be required
    }
  }

  async navigateToTradingApis() {
    console.log('🧭 Navigating to Trading APIs page...');
    
    try {
      await this.page.goto(this.config.growwTradingApisUrl, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });

      // Verify we're on the correct page
      const pageTitle = await this.page.title();
      console.log(`📄 Current page title: ${pageTitle}`);

      // Look for trading APIs specific elements
      const tradingApiSelectors = [
        'h1:contains("Trading APIs")',
        'h2:contains("API Key")',
        'button:contains("Generate")',
        '.api-key-section'
      ];

      let found = false;
      for (const selector of tradingApiSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            found = true;
            console.log(`✅ Trading APIs page confirmed: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!found) {
        await this.page.screenshot({ path: 'debug-trading-apis-page.png' });
        throw new Error('Trading APIs page not found or not loaded correctly');
      }

      console.log('✅ Successfully navigated to Trading APIs page');

    } catch (error) {
      console.error('❌ Failed to navigate to Trading APIs page:', error);
      throw error;
    }
  }

  async generateNewToken() {
    console.log('🎫 Generating new access token...');
    
    try {
      // Look for token generation button
      const generateButtonSelectors = [
        'button:contains("Generate New Token")',
        'button:contains("Generate Token")',
        'button:contains("Generate")',
        'button[data-testid="generate-token"]',
        '.generate-token-button'
      ];

      let generateButton = null;
      for (const selector of generateButtonSelectors) {
        try {
          generateButton = await this.page.$(selector);
          if (generateButton) {
            console.log(`✅ Found generate button: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!generateButton) {
        await this.page.screenshot({ path: 'debug-generate-button.png' });
        throw new Error('Generate token button not found');
      }

      // Click generate button
      console.log('👆 Clicking generate token button...');
      await generateButton.click();

      // Wait for token to be generated
      console.log('⏳ Waiting for token generation...');
      await this.page.waitForTimeout(3000);

      // Look for the generated token
      const tokenSelectors = [
        'input[readonly]:not([type="password"])',
        '.token-value',
        '[data-testid="access-token"]',
        'code',
        '.code-block'
      ];

      let tokenElement = null;
      let newToken = null;

      for (const selector of tokenSelectors) {
        try {
          tokenElement = await this.page.$(selector);
          if (tokenElement) {
            newToken = await this.page.evaluate(el => el.value || el.textContent, tokenElement);
            if (newToken && newToken.length > 50) {
              console.log(`✅ Found token using selector: ${selector}`);
              break;
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!newToken || newToken.length < 50) {
        await this.page.screenshot({ path: 'debug-token-not-found.png' });
        throw new Error('Generated token not found or invalid');
      }

      console.log(`✅ New token generated: ${newToken.substring(0, 50)}...`);
      return newToken;

    } catch (error) {
      console.error('❌ Token generation failed:', error);
      throw error;
    }
  }

  async updateVercelEnvironment(token) {
    console.log('🔄 Updating Vercel environment variable...');
    
    try {
      const vercelApiUrl = `https://api.vercel.com/v9/projects/${this.config.vercelProjectId}/env`;
      
      // First, try to get existing environment variable
      const getResponse = await axios.get(vercelApiUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.vercelToken}`,
          'Content-Type': 'application/json'
        }
      });

      const existingEnvVars = getResponse.data.envs || [];
      const existingTokenVar = existingEnvVars.find(env => env.key === 'REACT_APP_GROWW_ACCESS_TOKEN');

      if (existingTokenVar) {
        // Update existing environment variable
        console.log('📝 Updating existing environment variable...');
        
        const updateResponse = await axios.patch(
          `${vercelApiUrl}/${existingTokenVar.id}`,
          {
            value: token,
            target: ['production', 'preview']
          },
          {
            headers: {
              'Authorization': `Bearer ${this.config.vercelToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (updateResponse.status === 200) {
          console.log('✅ Environment variable updated successfully');
        } else {
          throw new Error(`Update failed with status: ${updateResponse.status}`);
        }
      } else {
        // Create new environment variable
        console.log('🆕 Creating new environment variable...');
        
        const createResponse = await axios.post(
          vercelApiUrl,
          {
            key: 'REACT_APP_GROWW_ACCESS_TOKEN',
            value: token,
            target: ['production', 'preview'],
            type: 'encrypted'
          },
          {
            headers: {
              'Authorization': `Bearer ${this.config.vercelToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (createResponse.status === 200 || createResponse.status === 201) {
          console.log('✅ Environment variable created successfully');
        } else {
          throw new Error(`Creation failed with status: ${createResponse.status}`);
        }
      }

      console.log('✅ Vercel environment updated successfully');

    } catch (error) {
      console.error('❌ Failed to update Vercel environment:', error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      
      throw error;
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  async run() {
    const startTime = Date.now();
    console.log(`🎯 Starting Groww Token Automation at ${new Date().toISOString()}`);
    
    try {
      await this.initialize();
      await this.loginToGroww();
      await this.navigateToTradingApis();
      const newToken = await this.generateNewToken();
      await this.updateVercelEnvironment(newToken);
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`✅ Automation completed successfully in ${duration}s`);
      
      return {
        success: true,
        token: newToken.substring(0, 50) + '...',
        duration: duration,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      console.error(`❌ Automation failed after ${duration}s:`, error);
      
      return {
        success: false,
        error: error.message,
        duration: duration,
        timestamp: new Date().toISOString()
      };
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  try {
    const automation = new GrowwTokenAutomation();
    const result = await automation.run();
    
    console.log('\n📊 Final Result:', JSON.stringify(result, null, 2));
    
    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = GrowwTokenAutomation;