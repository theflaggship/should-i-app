import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SearchScreen from './SearchScreen';
import PollDetailsScreen from '../PollDetailsScreen'
import OtherUserProfileScreen from '../OtherUserProfileScreen';
import FollowersFollowingScreen from '../FollowersFollowingScreen';

const Stack = createStackNavigator();

const SearchStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="PollDetails" component={PollDetailsScreen} />
      <Stack.Screen name="OtherUserProfile" component={OtherUserProfileScreen}/>
      <Stack.Screen name="FollowersFollowingScreen" component={FollowersFollowingScreen}/>
    </Stack.Navigator>
  );
};

export default SearchStack;