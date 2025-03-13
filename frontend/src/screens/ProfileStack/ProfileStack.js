// src/navigation/ProfileStackNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ProfileScreen from '../ProfileStack/ProfileScreen';
import PollDetailsScreen from '../PollDetailsScreen';
import OtherUserProfileScreen from '../OtherUserProfileScreen';

const Stack = createStackNavigator();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="PollDetails" component={PollDetailsScreen} />
      <Stack.Screen name="OtherUserProfile" component={OtherUserProfileScreen}/>
    </Stack.Navigator>
  );
}
