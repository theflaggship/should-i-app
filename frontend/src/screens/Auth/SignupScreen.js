// src/screens/Auth/SignupScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { signup as signupApi } from '../../services/authService';
import colors from '../../styles/colors';

const SignupScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);

  const handleSignup = async () => {
    try {
      await signupApi(email, username, password);
      navigation.navigate('Login');
    } catch (err) {
      setError('Signup failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create an account</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.inputContainer}>
      <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.onDarkPlaceHolder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.onDarkPlaceHolder}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.onDarkPlaceHolder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
        <Text style={styles.signupButtonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.switchText}>
          Already have an account?{' '}
          <Text style={styles.switchLink}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 20,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  inputContainer: {
  },
  input: {
    borderRadius: 25,
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    paddingLeft: 20,
    color: colors.dark,
  },
  signupButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  signupButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    textAlign: 'center',
    color: colors.dark,
    fontSize: 14,
  },
  // Link color is now secondary instead of primary
  switchLink: {
    color: colors.secondary,
    fontWeight: '500',
    textDecorationLine: 'none',
  },
});
