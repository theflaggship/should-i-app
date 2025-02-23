// src/navigation/AppNavigator.js
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import PollDetailsScreen from '../screens/PollDetailsScreen';
import { AuthContext } from '../context/AuthContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator>
          {/* Show the tab navigator first */}
          <Stack.Screen
            name="MainTabs"
            component={MainTabNavigator}
            options={{ headerShown: false }} // Hide header so tabs are full screen
          />

          {/* Register PollDetails as a separate screen in the stack */}
          <Stack.Screen
            name="PollDetails"
            component={PollDetailsScreen}
            options={{ title: 'Poll Details' }} // Adjust as desired
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;

