// src/components/Header.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../styles/colors';

const Header = ({ title }) => (
  <View style={styles.header}>
    <Text style={styles.headerText}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.dark,
    padding: 16,
    alignItems: 'center'
  },
  headerText: {
    fontFamily: 'Quicksand-Bold',
    color: colors.light,
    fontSize: 20
  }
});

export default Header;
