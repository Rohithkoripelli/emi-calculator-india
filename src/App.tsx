import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ImprovedMainLayout } from './components/layout/ImprovedMainLayout';

function App() {
  return (
    <ThemeProvider>
      <ImprovedMainLayout />
    </ThemeProvider>
  );
}

export default App;
