// src/screens/Auth/LoginScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { login as loginApi } from '../../services/authService';
import colors from '../../styles/colors';

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      const data = await loginApi(username, password);
      login(data.user, data.token); // Save user + token in context
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
              <Image style={styles.logo} source={require('../../../assets/logos/whicha_and_logo_primary.png')} />
            </View>
      <Text style={styles.header}>Hello, welcome back</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.inputContainer}>
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

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.switchText}>
          Don’t have an account?{' '}
          <Text style={styles.switchLink}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground, // Blue background
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 20,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 20,
    textAlign: 'center',
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
  error: {
    fontFamily: 'Quicksand-Regular',
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  inputContainer: {
  },
  input: {
    fontFamily: 'Quicksand-Regular',
    borderRadius: 25,
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    paddingLeft: 20,
    color: colors.dark,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  loginButtonText: {
    fontFamily: 'Quicksand-SemiBold',
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    fontFamily: 'Quicksand-Regular',
    textAlign: 'center',
    color: colors.dark,
    fontSize: 14,
  },
  switchLink: {
    fontFamily: 'Quicksand-Regular',
    color: colors.secondary,
    fontWeight: '500',
    textDecorationLine: 'none',
  },
});
