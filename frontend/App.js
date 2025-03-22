import React, { useEffect, useContext } from 'react';
import { Text, TextInput } from 'react-native';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { usePollsStore } from './src/store/usePollsStore';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = { fontFamily: 'Quicksand-Regular' };

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = { fontFamily: 'Quicksand-Regular' };

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}

function Root() {
  const { token, user } = useContext(AuthContext);
  const initPolls = usePollsStore((s) => s.initPolls);

  useEffect(() => {
    if (token && user?.id) initPolls(token, user.id);
  }, [token, user?.id]);

  return <AppNavigator />;
}
