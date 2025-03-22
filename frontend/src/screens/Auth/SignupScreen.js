// src/screens/Auth/SignupScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { signup as signupApi } from '../../services/authService';
import colors from '../../styles/colors';

const SignupScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSignup = async () => {
    try {
      await signupApi(email, username, password);
      navigation.navigate('Login');
    } catch {
      setError('Signup failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image style={styles.logo} source={require('../../../graphics/whicha_and_logo_primary.png')} />
        <Text style={styles.tagline}>Ask it. Don’t overthink it.</Text>
      </View>

      <Text style={styles.header}>Create An Account.</Text>
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
          Already have an account? <Text style={styles.switchLink}>Log in</Text>
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
    alignItems: 'center',
    justifyContent: 'center',      // <-- center children vertically
    paddingHorizontal: 30,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    width: '100%',
    marginBottom: 50,      // pushes everything below further down
  },
  logo: {
    width: 250,
    height: 120,           // bump height a bit
    resizeMode: 'contain',
  },
  tagline: {
    position: 'absolute',
    top: 100,              // move it 100px below the top of the container (adjust as needed)
    fontSize: 20,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
  },
  header: {
    fontSize: 18,
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
    width: '100%',
  },
  input: {
    borderRadius: 25,
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    color: colors.dark,
  },
  signupButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 20,
    width: '100%',
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
  switchLink: {
    color: colors.primary,
    fontWeight: '500',
  },
});
