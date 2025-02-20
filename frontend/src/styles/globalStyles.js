// src/styles/globalStyles.js
import { StyleSheet } from 'react-native';
import colors from './colors';
import fonts from './fonts';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16
  },
  title: {
    fontSize: 24,
    color: colors.dark,
    fontFamily: fonts.primary,
    textAlign: 'center',
    marginBottom: 16
  },
  text: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.body
  }
});
