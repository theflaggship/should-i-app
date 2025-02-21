// src/screens/CreatePoll/PollTextScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import colors from '../../styles/colors';

const PollTextScreen = ({ navigation }) => {
  const [question, setQuestion] = useState('Should I ...?');

  const handleNext = () => {
    navigation.navigate('PollOptions', { question });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Should I..."
        value={question}
        onChangeText={setQuestion}
      />
      <Button title="Next" onPress={handleNext} color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.dark,
    padding: 12,
    borderRadius: 4,
    fontSize: 16,
    marginBottom: 16,
  },
});

export default PollTextScreen;
