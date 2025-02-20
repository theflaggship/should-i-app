// src/screens/CreatePoll/PollSettingsScreen.js
import React, { useState } from 'react';
import { View, Switch, TextInput, Button, StyleSheet, Text } from 'react-native';
import globalStyles from '../../styles/globalStyles';
import colors from '../../styles/colors';

const PollSettingsScreen = ({ navigation, route }) => {
  const { question, options } = route.params;
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [expirationDate, setExpirationDate] = useState('');

  const handleNext = () => {
    navigation.navigate('PollSummary', { question, options, isPrivate, allowComments, expirationDate });
  };

  return (
    <View style={globalStyles.container}>
      <View style={styles.row}>
        <Text style={globalStyles.text}>Private Poll:</Text>
        <Switch value={isPrivate} onValueChange={setIsPrivate} />
      </View>
      <View style={styles.row}>
        <Text style={globalStyles.text}>Allow Comments:</Text>
        <Switch value={allowComments} onValueChange={setAllowComments} />
      </View>
      <TextInput
        style={styles.input}
        placeholder="Expiration Date (YYYY-MM-DD HH:MM)"
        value={expirationDate}
        onChangeText={setExpirationDate}
      />
      {/* You can add category selection UI here */}
      <Button title="Next" onPress={handleNext} color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8
  },
  input: {
    borderWidth: 1,
    borderColor: colors.dark,
    padding: 12,
    borderRadius: 4,
    fontSize: 16,
    marginVertical: 8
  }
});

export default PollSettingsScreen;
