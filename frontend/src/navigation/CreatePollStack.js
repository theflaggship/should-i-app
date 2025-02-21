// src/navigation/CreatePollStack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PollTextScreen from '../screens/CreatePoll/PollTextScreen';
import PollOptionsScreen from '../screens/CreatePoll/PollOptionsScreen';
import PollSettingsScreen from '../screens/CreatePoll/PollSettingsScreen';
import PollSummaryScreen from '../screens/CreatePoll/PollSummaryScreen';

const Stack = createStackNavigator();

const CreatePollStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="PollText" component={PollTextScreen} options={{ title: 'Ask a Question' }} />
    <Stack.Screen name="PollOptions" component={PollOptionsScreen} options={{ title: 'Add Options' }} />
    <Stack.Screen name="PollSettings" component={PollSettingsScreen} options={{ title: 'Poll Settings' }} />
    <Stack.Screen name="PollSummary" component={PollSummaryScreen} options={{ title: 'Review & Post' }} />
  </Stack.Navigator>
);

export default CreatePollStack;
