// src/screens/Auth/SignupScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { signup as signupApi } from '../../services/authService';
import globalStyles from '../../styles/globalStyles';
import colors from '../../styles/colors';

const SignupScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');

  const handleSignup = async () => {
    try {
      await signupApi(username, email, password);
      navigation.navigate('Login');
    } catch (err) {
      setError('Signup failed. Please try again.');
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Sign Up</Text>
      {error ? <Text style={{ color: colors.error, textAlign: 'center' }}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Username"
        onChangeText={setUsername}
        autoCapitalize="none"
        value={username}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        onChangeText={setPassword}
        secureTextEntry
        value={password}
      />
      <Button title="Sign Up" onPress={handleSignup} color={colors.primary} />
      <Button title="Already have an account? Login" onPress={() => navigation.navigate('Login')} />
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.dark,
    padding: 12,
    marginVertical: 8,
    borderRadius: 4,
    fontFamily: 'Roboto'
  }
});

export default SignupScreen;
