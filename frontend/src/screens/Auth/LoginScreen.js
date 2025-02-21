// src/screens/Auth/LoginScreen.js
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { login as loginApi } from '../../services/authService';
import { AuthContext } from '../../context/AuthContext';
import globalStyles from '../../styles/globalStyles';
import colors from '../../styles/colors';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const data = await loginApi(username, password);
      // Save user and token in context (adjust based on your API response)
      login(data.user, data.token);
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Login</Text>
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
        placeholder="Password"
        onChangeText={setPassword}
        secureTextEntry
        value={password}
      />
      <Button title="Login" onPress={handleLogin} color={colors.primary} />
      <Button title="Don't have an account? Sign Up" onPress={() => navigation.navigate('Signup')} />
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

export default LoginScreen;
