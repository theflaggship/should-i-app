// src/screens/EditProfileScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import colors from '../../styles/colors';

const EditProfileScreen = ({ navigation }) => {
  const { user, login } = useContext(AuthContext);
  const [personalSummary, setPersonalSummary] = useState(user.personalSummary || '');

  const handleSave = () => {
    // In a real app, you would update the profile on the backend
    // Then update the context. For now, we just simulate:
    const updatedUser = { ...user, personalSummary };
    login(updatedUser, null); // or however you store the token
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <Text style={styles.label}>Personal Summary</Text>
      <TextInput
        style={styles.input}
        value={personalSummary}
        onChangeText={setPersonalSummary}
        placeholder="Tell us about yourself..."
        placeholderTextColor="#999"
        multiline
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
    padding: 20,
  },
  title: {
    fontSize: 20,
    color: colors.dark,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: colors.dark,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.dark,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#21D0B2',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#999',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '500',
  },
});
