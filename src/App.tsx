import React, { useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ImprovedMainLayout } from './components/layout/ImprovedMainLayout';
import { GrowwApiUtils } from './services/growwApiUtils';

function App() {
  useEffect(() => {
    // Initialize Groww API token management on app startup
    const initializeGrowwAPI = async () => {
      try {
        console.log('🚀 Initializing Groww API token management...');
        
        // Check if credentials are available
        const hasApiKey = !!(process.env.REACT_APP_GROWW_API_KEY);
        const hasTotpSecret = !!(process.env.REACT_APP_GROWW_TOTP_SECRET);
        
        if (hasApiKey && hasTotpSecret) {
          console.log('✅ Groww API credentials found, setting up automated token management');
          
          // Test token generation
          await GrowwApiUtils.testTokenGeneration();
          
          // Setup automated refresh
          GrowwApiUtils.setupAutomatedRefresh();
          
        } else {
          console.warn('⚠️ Groww API credentials not found. Add REACT_APP_GROWW_API_KEY and REACT_APP_GROWW_TOTP_SECRET to environment variables');
          GrowwApiUtils.displaySetupInstructions();
        }
        
      } catch (error) {
        console.error('❌ Error initializing Groww API:', error);
      }
    };
    
    initializeGrowwAPI();
  }, []);

  return (
    <ThemeProvider>
      <ImprovedMainLayout />
    </ThemeProvider>
  );
}

export default App;
