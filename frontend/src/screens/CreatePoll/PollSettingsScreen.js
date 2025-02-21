// src/screens/CreatePoll/PollSettingsScreen.js
import React, { useState } from 'react';
import { View, Switch, TextInput, Button, StyleSheet, Text } from 'react-native';
import colors from '../../styles/colors';

const PollSettingsScreen = ({ navigation, route }) => {
  const { question, options } = route.params;
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [expirationDate, setExpirationDate] = useState('');

  const handleNext = () => {
    navigation.navigate('PollSummary', {
      question,
      options,
      isPrivate,
      allowComments,
      expirationDate,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Private Poll?</Text>
        <Switch value={isPrivate} onValueChange={setIsPrivate} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Allow Comments?</Text>
        <Switch value={allowComments} onValueChange={setAllowComments} />
      </View>
      <TextInput
        style={styles.input}
        placeholder="Expiration Date (YYYY-MM-DD)"
        value={expirationDate}
        onChangeText={setExpirationDate}
      />
      <Button title="Next" onPress={handleNext} color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  label: { flex: 1, fontSize: 16, color: colors.dark },
  input: {
    borderWidth: 1,
    borderColor: colors.dark,
    padding: 12,
    borderRadius: 4,
    fontSize: 16,
    marginVertical: 8,
  },
});

export default PollSettingsScreen;
