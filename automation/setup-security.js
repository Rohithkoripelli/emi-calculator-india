#!/usr/bin/env node

/**
 * Security Setup Script for Groww Token Automation
 * Helps configure secure credentials and validates security settings
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class SecuritySetup {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async ask(question) {
    return new Promise(resolve => {
      this.rl.question(question, resolve);
    });
  }

  async askPassword(question) {
    return new Promise(resolve => {
      process.stdout.write(question);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      
      let password = '';
      process.stdin.on('data', (ch) => {
        ch = ch.toString('utf8');
        
        switch (ch) {
          case '\n':
          case '\r':
          case '\u0004': // Ctrl+D
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdout.write('\n');
            resolve(password);
            break;
          case '\u0003': // Ctrl+C
            process.exit();
            break;
          case '\u007f': // Backspace
            if (password.length > 0) {
              password = password.slice(0, -1);
              process.stdout.write('\b \b');
            }
            break;
          default:
            password += ch;
            process.stdout.write('*');
            break;
        }
      });
    });
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePin(pin) {
    const pinRegex = /^\d{4,6}$/;
    return pinRegex.test(pin);
  }

  async checkGoogleSecurity() {
    console.log('\n🔐 Google Account Security Check');
    console.log('=' .repeat(40));
    
    const questions = [
      {
        q: 'Do you have 2-Factor Authentication enabled on your Google account? (y/n): ',
        check: (answer) => answer.toLowerCase() === 'y',
        error: '⚠️  We strongly recommend enabling 2FA on your Google account'
      },
      {
        q: 'Are you using an App Password instead of your main Google password? (y/n): ',
        check: (answer) => answer.toLowerCase() === 'y',
        error: '⚠️  We recommend using App Passwords for better security'
      }
    ];

    let securityScore = 0;
    for (const { q, check, error } of questions) {
      const answer = await this.ask(q);
      if (check(answer)) {
        securityScore++;
        console.log('✅ Good security practice');
      } else {
        console.log(error);
      }
    }

    console.log(`\n📊 Security Score: ${securityScore}/${questions.length}`);
    
    if (securityScore < questions.length) {
      console.log('\n💡 Security Recommendations:');
      console.log('1. Enable 2FA: https://myaccount.google.com/security');
      console.log('2. Create App Password: https://myaccount.google.com/apppasswords');
      console.log('3. Review account security: https://myaccount.google.com/security-checkup');
    }

    return securityScore === questions.length;
  }

  async collectCredentials() {
    console.log('\n📝 Credential Collection');
    console.log('=' .repeat(30));
    
    const credentials = {};

    // Google Email
    while (true) {
      credentials.email = await this.ask('Enter your Google email: ');
      if (this.validateEmail(credentials.email)) {
        console.log('✅ Valid email format');
        break;
      } else {
        console.log('❌ Invalid email format. Please try again.');
      }
    }

    // Google Password
    while (true) {
      credentials.password = await this.askPassword('Enter your Google password (or App Password): ');
      if (credentials.password.length >= 8) {
        console.log('✅ Password accepted');
        break;
      } else {
        console.log('❌ Password too short. Please use at least 8 characters.');
      }
    }

    // Groww PIN
    while (true) {
      credentials.pin = await this.askPassword('Enter your Groww PIN (4-6 digits): ');
      if (this.validatePin(credentials.pin)) {
        console.log('✅ Valid PIN format');
        break;
      } else {
        console.log('❌ Invalid PIN format. Please enter 4-6 digits.');
      }
    }

    return credentials;
  }

  async getVercelCredentials() {
    console.log('\n🔗 Vercel API Setup');
    console.log('=' .repeat(25));
    
    console.log('📋 Steps to get Vercel credentials:');
    console.log('1. Go to: https://vercel.com/account/tokens');
    console.log('2. Create a new token with "Full Access" or minimal scope');
    console.log('3. Copy the token (starts with "vercel_...")');
    console.log('4. Get your project ID from project settings');
    console.log('');

    const vercelToken = await this.ask('Enter your Vercel token: ');
    const vercelProjectId = await this.ask('Enter your Vercel project ID: ');

    if (!vercelToken.startsWith('vercel_')) {
      console.log('⚠️  Warning: Token doesn\'t start with "vercel_" - verify it\'s correct');
    }

    return { vercelToken, vercelProjectId };
  }

  async createEnvFile(credentials, vercelCreds) {
    console.log('\n📄 Creating .env file...');
    
    const envContent = `# Groww Token Automation Environment Variables
# Generated on ${new Date().toISOString()}

# ===========================================
# GROWW CREDENTIALS
# ===========================================
GROWW_GOOGLE_EMAIL=${credentials.email}
GROWW_GOOGLE_PASSWORD=${credentials.password}
GROWW_PIN=${credentials.pin}

# ===========================================
# VERCEL API CREDENTIALS
# ===========================================
VERCEL_TOKEN=${vercelCreds.vercelToken}
VERCEL_PROJECT_ID=${vercelCreds.vercelProjectId}

# ===========================================
# AUTOMATION SETTINGS
# ===========================================
NODE_ENV=development
TEST_MODE=false

# ===========================================
# SECURITY NOTES
# ===========================================
# 1. This file contains sensitive credentials
# 2. Never commit this file to version control
# 3. Rotate credentials regularly
# 4. Use app passwords for Google instead of main password
`;

    const envPath = path.join(__dirname, '.env');
    fs.writeFileSync(envPath, envContent);
    
    console.log(`✅ Environment file created: ${envPath}`);
    console.log('⚠️  Keep this file secure and never commit it to git');
  }

  async setupGitHubSecrets(credentials, vercelCreds) {
    console.log('\n🔒 GitHub Secrets Setup');
    console.log('=' .repeat(30));
    
    console.log('Add these secrets to your GitHub repository:');
    console.log('Repository → Settings → Secrets and Variables → Actions → New repository secret');
    console.log('');
    
    const secrets = {
      'GROWW_GOOGLE_EMAIL': credentials.email,
      'GROWW_GOOGLE_PASSWORD': '***hidden***',
      'GROWW_PIN': '***hidden***',
      'VERCEL_TOKEN': '***hidden***',
      'VERCEL_PROJECT_ID': vercelCreds.vercelProjectId
    };

    for (const [name, value] of Object.entries(secrets)) {
      console.log(`📌 ${name}: ${value}`);
    }

    console.log('\n💡 Security Tips:');
    console.log('- Use a private repository for this automation');
    console.log('- Limit access to repository settings');
    console.log('- Regularly rotate your credentials');
    console.log('- Monitor GitHub Actions logs for any issues');
  }

  async testVercelConnection(vercelCreds) {
    console.log('\n🧪 Testing Vercel API Connection...');
    
    try {
      const axios = require('axios');
      
      const response = await axios.get(`https://api.vercel.com/v9/projects/${vercelCreds.vercelProjectId}`, {
        headers: {
          'Authorization': `Bearer ${vercelCreds.vercelToken}`
        }
      });

      if (response.status === 200) {
        console.log('✅ Vercel API connection successful');
        console.log(`📝 Project: ${response.data.name}`);
        return true;
      }

    } catch (error) {
      console.error('❌ Vercel API connection failed:', error.response?.data || error.message);
      console.log('\n💡 Troubleshooting:');
      console.log('1. Verify your Vercel token has correct permissions');
      console.log('2. Check that the project ID is correct');
      console.log('3. Ensure the token hasn\'t expired');
      return false;
    }
  }

  async run() {
    console.log('🛡️  Groww Token Automation Security Setup');
    console.log('='.repeat(50));
    console.log('This script will help you securely configure the automation.\n');

    try {
      // Check Google security
      await this.checkGoogleSecurity();

      // Collect credentials
      const credentials = await this.collectCredentials();

      // Get Vercel credentials
      const vercelCreds = await this.getVercelCredentials();

      // Test Vercel connection
      await this.testVercelConnection(vercelCreds);

      // Create .env file
      await this.createEnvFile(credentials, vercelCreds);

      // Show GitHub secrets setup
      await this.setupGitHubSecrets(credentials, vercelCreds);

      console.log('\n🎉 Security setup completed!');
      console.log('\n🚀 Next steps:');
      console.log('1. Test the configuration: npm test');
      console.log('2. Run a dry run: npm test dryrun');
      console.log('3. Set up GitHub secrets for automated runs');
      console.log('4. Test manual run: npm start');

    } catch (error) {
      console.error('\n❌ Setup failed:', error);
    } finally {
      this.rl.close();
    }
  }
}

// Main execution
if (require.main === module) {
  const setup = new SecuritySetup();
  setup.run().catch(console.error);
}

module.exports = SecuritySetup;