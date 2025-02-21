// src/screens/CreatePoll/PollSummaryScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import colors from '../../styles/colors';
import { createPoll } from '../../services/pollService';

const PollSummaryScreen = ({ navigation, route }) => {
  const { question, options, isPrivate, allowComments, expirationDate } = route.params;

  const handlePostPoll = async () => {
    // Call your pollService to create the poll
    await createPoll({ question, options, isPrivate, allowComments, expirationDate });
    // Navigate back to home or show success
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Your Poll</Text>
      <Text style={styles.label}>Question: {question}</Text>
      {options.map(opt => (
        <Text key={opt.key} style={styles.label}>Option {opt.key}: {opt.text}</Text>
      ))}
      <Text style={styles.label}>Private: {isPrivate ? 'Yes' : 'No'}</Text>
      <Text style={styles.label}>Allow Comments: {allowComments ? 'Yes' : 'No'}</Text>
      <Text style={styles.label}>Expiration: {expirationDate || 'None'}</Text>
      <Button title="Post Poll" onPress={handlePostPoll} color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  title: { fontSize: 20, marginBottom: 16, textAlign: 'center', color: colors.dark },
  label: { fontSize: 16, marginVertical: 4, color: colors.dark },
});

export default PollSummaryScreen;
