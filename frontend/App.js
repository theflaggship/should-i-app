// App.js
import React, { useEffect, useContext } from 'react';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { usePollsStore } from './src/store/usePollsStore';

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}

/**
 * Root component that:
 * 1) Reads the token from AuthContext
 * 2) Calls initPolls(token) in Zustand
 */
function Root() {
  const { token } = useContext(AuthContext);
  const initPolls = usePollsStore((state) => state.initPolls);

  useEffect(() => {
    // If we have a token, initialize polls & connect websockets
    if (token) {
      initPolls(token);
    }
  }, [token]);

  // Render your app’s navigation
  return <AppNavigator />;
}
