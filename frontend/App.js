// App.js
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { PollsProvider } from './src/context/PollsContext';

export default function App() {
  return (
    <AuthProvider>
      <PollsProvider>
        <AppNavigator />
      </PollsProvider>
    </AuthProvider>
  );
}
