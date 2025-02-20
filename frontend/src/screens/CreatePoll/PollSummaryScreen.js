// src/screens/CreatePoll/PollSummaryScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import globalStyles from '../../styles/globalStyles';
import colors from '../../styles/colors';

const PollSummaryScreen = ({ navigation, route }) => {
  const { question, options, isPrivate, allowComments, expirationDate } = route.params;

  const handlePostPoll = () => {
    // Here you would call your pollService to create the poll in the backend
    // After success, navigate back to HomeScreen or show a success message.
    navigation.navigate('Home');
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Review Your Poll</Text>
      <Text style={globalStyles.text}>Question: {question}</Text>
      {options.map(opt => (
        <Text key={opt.key} style={globalStyles.text}>Option {opt.key}: {opt.text}</Text>
      ))}
      <Text style={globalStyles.text}>Private: {isPrivate ? 'Yes' : 'No'}</Text>
      <Text style={globalStyles.text}>Allow Comments: {allowComments ? 'Yes' : 'No'}</Text>
      <Text style={globalStyles.text}>Expiration: {expirationDate || 'None'}</Text>
      <Button title="Post Poll" onPress={handlePostPoll} color={colors.primary} />
    </View>
  );
};

export default PollSummaryScreen;
