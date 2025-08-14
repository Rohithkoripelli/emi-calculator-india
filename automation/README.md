# Groww Token Automation

Automated daily renewal of Groww API access tokens using RPA (Robotic Process Automation) with Puppeteer.

## 🎯 What This Does

- **Automates login** to Groww using your Google credentials + PIN
- **Generates new tokens** daily at 5:55 AM IST
- **Updates Vercel** environment variables automatically
- **Handles errors** with detailed logging and screenshots
- **Runs unattended** via GitHub Actions

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd automation
npm install
```

### 2. Configure Credentials

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
GROWW_GOOGLE_EMAIL=your.email@gmail.com
GROWW_GOOGLE_PASSWORD=your_google_password
GROWW_PIN=1234
VERCEL_TOKEN=your_vercel_token
VERCEL_PROJECT_ID=your_project_id
```

### 3. Test the Setup

```bash
# Test all components
npm test

# Test specific components
npm test config    # Test configuration
npm test vercel    # Test Vercel API
npm test browser   # Test browser automation
npm test dryrun    # Full test without updating Vercel
```

### 4. Run Manually

```bash
# Development mode (shows browser)
npm run dev

# Production mode (headless)
npm start
```

## 🔧 GitHub Actions Setup

### 1. Add Repository Secrets

Go to your GitHub repository → Settings → Secrets and Variables → Actions

Add these secrets:
- `GROWW_GOOGLE_EMAIL` - Your Google email
- `GROWW_GOOGLE_PASSWORD` - Your Google password
- `GROWW_PIN` - Your Groww PIN
- `VERCEL_TOKEN` - Your Vercel API token
- `VERCEL_PROJECT_ID` - Your Vercel project ID

### 2. Enable Workflows

The workflow file `.github/workflows/groww-token-renewal.yml` is already configured to:
- Run daily at 5:55 AM IST (12:25 AM UTC)
- Allow manual triggering for testing
- Upload debug screenshots on failure

### 3. Test Manual Run

1. Go to Actions tab in your GitHub repository
2. Select "Groww Token Auto-Renewal"
3. Click "Run workflow"
4. Check the logs for any issues

## 🔐 Security Best Practices

### Google Account Security
1. **Use App Password**: Instead of your main Google password
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a new app password for this automation

2. **Enable 2FA**: Always use two-factor authentication

### Vercel Security
1. **Minimal Token Scope**: Create token with minimal required permissions
2. **Regular Rotation**: Rotate your Vercel token monthly

### GitHub Security
1. **Repository Secrets**: Never commit credentials to the repository
2. **Private Repository**: Keep the automation code in a private repo
3. **Access Control**: Limit who can modify GitHub Actions

## 🛠 How It Works

### Authentication Flow
1. **Navigate** to Groww login page
2. **Click** "Continue with Google" button
3. **Enter** Google email and password
4. **Handle** any 2FA prompts (if configured)
5. **Enter** Groww PIN when prompted
6. **Navigate** to Trading APIs page

### Token Generation
1. **Find** the "Generate Token" button
2. **Click** to generate new token
3. **Extract** the generated token value
4. **Validate** token format and length

### Vercel Update
1. **Check** for existing environment variable
2. **Update** or create `REACT_APP_GROWW_ACCESS_TOKEN`
3. **Set** for production and preview environments
4. **Verify** successful update

## 🐛 Troubleshooting

### Common Issues

#### 1. Login Failures
- **Google 2FA**: The script doesn't handle SMS/authenticator codes yet
- **Captcha**: Google may show captcha for automated logins
- **Solution**: Use app passwords and mark automation IP as trusted

#### 2. PIN Entry Issues
- **Wrong PIN**: Verify your PIN is correct
- **PIN Format**: Some accounts use 4-digit, others 6-digit PINs
- **Solution**: Double-check PIN in Groww mobile app

#### 3. Token Generation Failures
- **Page Changes**: Groww may change their UI
- **Solution**: Update selectors in the automation script

#### 4. Vercel API Errors
- **Invalid Token**: Check your Vercel token permissions
- **Wrong Project ID**: Verify the project ID in Vercel dashboard
- **Solution**: Regenerate Vercel token with correct scope

### Debug Mode

Run in debug mode to see browser interactions:
```bash
NODE_ENV=development npm start
```

This will:
- Show the browser window
- Slow down interactions
- Take screenshots at each step
- Print detailed logs

### Screenshots

On failure, the automation saves debug screenshots:
- `debug-login-page.png` - Login page state
- `debug-login-error.png` - Login failure point
- `debug-trading-apis-page.png` - Trading APIs page
- `debug-generate-button.png` - Token generation area
- `debug-token-not-found.png` - Token extraction failure

## 🔄 Monitoring & Maintenance

### Daily Monitoring
- Check GitHub Actions for failed runs
- Monitor Vercel deployment logs
- Verify your app is using live Groww data

### Monthly Maintenance
- Rotate Vercel API tokens
- Update Google app password
- Review and update selectors if Groww changes UI

### Backup Plan
Always have a manual backup process:
1. Bookmark: https://groww.in/user/profile/trading-apis
2. Set phone reminder for 6 AM IST
3. Know how to manually update Vercel environment variables

## 📝 Logs & Monitoring

The automation provides comprehensive logging:

```
🚀 Starting Groww Token Automation at 2024-01-15T00:25:00.000Z
✅ Configuration validated
✅ Browser initialized
🔐 Starting Groww login process...
📱 Navigating to Groww login page...
🔍 Looking for Google Sign-in button...
✅ Found Google Sign-in button: button[data-testid="google-login"]
👆 Clicking Google Sign-in button...
⏳ Waiting for Google login page...
📧 Entering Google email...
➡️ Clicking Next button...
🔑 Entering Google password...
🔓 Clicking Sign In button...
🔄 Waiting for redirect to Groww...
🔢 Checking if PIN entry is required...
✅ Found PIN input: input[type="password"][maxlength="4"]
🔢 Entering PIN...
✅ PIN submitted
🧭 Navigating to Trading APIs page...
📄 Current page title: Trading APIs - Groww
✅ Trading APIs page confirmed: h1:contains("Trading APIs")
✅ Successfully navigated to Trading APIs page
🎫 Generating new access token...
✅ Found generate button: button:contains("Generate Token")
👆 Clicking generate token button...
⏳ Waiting for token generation...
✅ Found token using selector: input[readonly]:not([type="password"])
✅ New token generated: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
🔄 Updating Vercel environment variable...
📝 Updating existing environment variable...
✅ Environment variable updated successfully
✅ Vercel environment updated successfully
🧹 Cleaning up...
✅ Cleanup completed
✅ Automation completed successfully in 45.2s
```

## 🔮 Future Enhancements

Possible improvements:
1. **Email Notifications**: Send success/failure emails
2. **Slack Integration**: Post to Slack channel on completion
3. **Multi-Account Support**: Handle multiple Groww accounts
4. **Smart Retry Logic**: Retry failed steps with exponential backoff
5. **Health Checks**: Verify token works after generation
6. **Analytics**: Track success rates and performance metrics

## 🆘 Support

If you encounter issues:

1. **Check Logs**: Review GitHub Actions logs for errors
2. **Run Tests**: Use `npm test` to isolate issues
3. **Debug Mode**: Run locally with `NODE_ENV=development`
4. **Screenshots**: Check debug screenshots for UI changes
5. **Manual Verification**: Ensure you can login manually first

Remember: This automation replicates your manual actions, so if something doesn't work manually, the automation won't work either.