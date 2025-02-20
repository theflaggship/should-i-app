// src/screens/EditProfileScreen.js
import React, { useState, useContext } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import globalStyles from '../styles/globalStyles';
import colors from '../styles/colors';

const EditProfileScreen = ({ navigation }) => {
  const { user, login } = useContext(AuthContext);
  const [personalSummary, setPersonalSummary] = useState(user.personalSummary || '');
  
  const handleSave = () => {
    // In a real app, you would update the profile on the backend
    // Then update the context (here we simulate it)
    const updatedUser = { ...user, personalSummary };
    login(updatedUser, null);
    navigation.goBack();
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Edit Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Personal Summary"
        value={personalSummary}
        onChangeText={setPersonalSummary}
        multiline
      />
      <Button title="Save" onPress={handleSave} color={colors.primary} />
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
    marginVertical: 8,
    height: 100,
    textAlignVertical: 'top'
  }
});

export default EditProfileScreen;
