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
  const { token, user } = useContext(AuthContext);
  const initPolls = usePollsStore((state) => state.initPolls);

  useEffect(() => {
    if (token && user?.id) {
      // pass both the token and the user.id
      initPolls(token, user.id);
    }
  }, [token, user?.id]);

  return <AppNavigator />;
}
