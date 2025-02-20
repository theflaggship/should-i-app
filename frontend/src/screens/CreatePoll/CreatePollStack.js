// src/screens/CreatePoll/CreatePollStack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PollTextScreen from './PollTextScreen';
import PollOptionsScreen from './PollOptionsScreen';
import PollSettingsScreen from './PollSettingsScreen';
import PollSummaryScreen from './PollSummaryScreen';

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
