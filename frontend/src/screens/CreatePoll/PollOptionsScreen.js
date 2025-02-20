// src/screens/CreatePoll/PollOptionsScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, FlatList, Text } from 'react-native';
import globalStyles from '../../styles/globalStyles';
import colors from '../../styles/colors';

const PollOptionsScreen = ({ navigation, route }) => {
  const { question } = route.params;
  const [options, setOptions] = useState([{ key: '1', text: '' }, { key: '2', text: '' }]);

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, { key: `${options.length + 1}`, text: '' }]);
    }
  };

  const updateOption = (key, text) => {
    setOptions(options.map(opt => opt.key === key ? { ...opt, text } : opt));
  };

  const handleNext = () => {
    navigation.navigate('PollSettings', { question, options });
  };

  return (
    <View style={globalStyles.container}>
      <FlatList
        data={options}
        keyExtractor={item => item.key}
        renderItem={({ item }) => (
          <TextInput
            style={styles.input}
            placeholder={`Option ${item.key}`}
            value={item.text}
            onChangeText={(text) => updateOption(item.key, text)}
          />
        )}
      />
      {options.length < 4 && <Button title="Add Option" onPress={addOption} color={colors.secondary} />}
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
    fontSize: 16,
    marginVertical: 8
  }
});

export default PollOptionsScreen;
