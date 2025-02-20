// src/components/PollCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../styles/colors';
import fonts from '../styles/fonts';

const PollCard = ({ poll }) => (
  <View style={styles.card}>
    <Text style={styles.question}>{poll.question}</Text>
    {/* You can extend this to show a snippet of poll options or votes */}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
    marginVertical: 8
  },
  question: {
    fontSize: 18,
    color: colors.dark,
    fontFamily: fonts.primary
  }
});

export default PollCard;
