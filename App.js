import React from 'react';
import { StatusBar } from 'expo-status-bar';

// CRITICAL: Buffer polyfill MUST be first
import { Buffer } from 'buffer';
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// Crypto polyfill for React Native
import { getRandomValues } from 'expo-crypto';
if (typeof global.crypto === 'undefined') {
  global.crypto = { getRandomValues };
}

import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/components/Navigation';
import ErrorBoundary from './src/components/ErrorBoundary';
import { colors } from './src/styles/theme';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <StatusBar style="light" backgroundColor={colors.background} />
        <AppNavigator />
      </AppProvider>
    </ErrorBoundary>
  );
}
