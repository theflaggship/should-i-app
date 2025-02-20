// src/components/Header.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Header = ({ title }) => (
  <View style={styles.header}>
    <Text style={styles.headerText}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1DCDFE',
    padding: 16,
    alignItems: 'center'
  },
  headerText: {
    color: '#fff',
    fontSize: 20
  }
});

export default Header;
