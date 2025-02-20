// src/screens/CreatePoll/PollTextScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import globalStyles from '../../styles/globalStyles';
import colors from '../../styles/colors';

const PollTextScreen = ({ navigation }) => {
  const [question, setQuestion] = useState('Should I...');
  
  const handleNext = () => {
    navigation.navigate('PollOptions', { question });
  };

  return (
    <View style={globalStyles.container}>
      <TextInput
        style={styles.input}
        value={question}
        onChangeText={setQuestion}
        placeholder="Enter your poll question"
      />
      <Button title="Next" onPress={handleNext} color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.dark,
    padding: 12,
    borderRadius: 4,
    fontSize: 18,
    marginBottom: 16
  }
});

export default PollTextScreen;
