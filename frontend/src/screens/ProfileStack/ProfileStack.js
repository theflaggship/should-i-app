// src/navigation/ProfileStackNavigator.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ProfileScreen from '../ProfileStack/ProfileScreen';
import PollDetailsScreen from '../PollDetailsScreen';
import OtherUserProfileScreen from '../OtherUserProfileScreen';
import FollowersFollowingScreen from '../FollowersFollowingScreen';

const Stack = createStackNavigator();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          animation: 'slide_from_left',
        }} />
      <Stack.Screen name="PollDetails" component={PollDetailsScreen} />
      <Stack.Screen name="OtherUserProfile" component={OtherUserProfileScreen} />
      <Stack.Screen name="FollowersFollowingScreen" component={FollowersFollowingScreen}
      />
    </Stack.Navigator>
  );
}
