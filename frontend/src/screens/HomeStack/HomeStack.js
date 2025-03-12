import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './HomeScreen';
import PollDetailsScreen from '../PollDetailsScreen'
import OtherUserProfileScreen from '../OtherUserProfileScreen';

const Stack = createStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="PollDetails" component={PollDetailsScreen} />
      <Stack.Screen name="OtherUserProfile" component={OtherUserProfileScreen}/>
    </Stack.Navigator>
  );
};

export default HomeStack;