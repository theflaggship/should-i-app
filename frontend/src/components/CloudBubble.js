// CloudBubble.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../styles/colors';

/**
 * A simple "cloud bubble" text box using small white circles around
 * a rectangular container. Circles are manually placed along each edge.
 * 
 * Tweak circle positions to suit your design. 
 */
const CloudBubble = ({ text }) => {
  return (
    <View style={styles.cloudContainer}>
      {/* The main text */}
      <Text style={styles.cloudText}>{text}</Text>

      {/* Circles around the top edge */}
      <View style={[styles.circle, styles.circleTop1]} />
      <View style={[styles.circle, styles.circleTop2]} />
      <View style={[styles.circle, styles.circleTop3]} />
      <View style={[styles.circle, styles.circleTop4]} />
      <View style={[styles.circle, styles.circleTop5]} />
      <View style={[styles.circle, styles.circleTop6]} />
      <View style={[styles.circle, styles.circleTop7]} />
      <View style={[styles.circle, styles.circleTop8]} />
      <View style={[styles.circle, styles.circleTop9]} />
      <View style={[styles.circle, styles.circleTop10]} />
      {/* <View style={[styles.circle, styles.circleTop11]} />
      <View style={[styles.circle, styles.circleTop12]} /> */}

      {/* Circles around the bottom edge */}
      <View style={[styles.circle, styles.circleBottom1]} />
      <View style={[styles.circle, styles.circleBottom2]} />
      <View style={[styles.circle, styles.circleBottom3]} />
      <View style={[styles.circle, styles.circleBottom4]} />
      <View style={[styles.circle, styles.circleBottom5]} />
      <View style={[styles.circle, styles.circleBottom6]} />
      <View style={[styles.circle, styles.circleBottom7]} />
      <View style={[styles.circle, styles.circleBottom8]} />
      <View style={[styles.circle, styles.circleBottom9]} />
      <View style={[styles.circle, styles.circleBottom10]} />
      {/* <View style={[styles.circle, styles.circleBottom11]} />
      <View style={[styles.circle, styles.circleBottom12]} /> */}

      {/* Circles on the left edge */}
      <View style={[styles.circle, styles.circleLeft1]} />
      <View style={[styles.circle, styles.circleLeft2]} />
      {/* <View style={[styles.circle, styles.circleLeft3]} />
      <View style={[styles.circle, styles.circleLeft4]} /> */}

      {/* Circles on the right edge */}
      <View style={[styles.circle, styles.circleRight1]} />
      {/* <View style={[styles.circle, styles.circleRight2]} /> */}
      {/* <View style={[styles.circle, styles.circleRight3]} />
      <View style={[styles.circle, styles.circleRight4]} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  cloudContainer: {
    position: 'absolute',
    top: -20,
    left: 50,
    backgroundColor: '#fff', // main bubble color
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 50,
    borderRadius: 20,
    // You could add a subtle shadow here:
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
    margin: 20,
  },
  cloudText: {
    fontSize: 12,
    color: colors.dark,
  },
  circle: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },

  // ============== Top edge circles ==============
  circleTop1: {
    top: -15,
    left: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  circleTop2: {
    top: -12,
    left: 25,
    width: 25,
    height: 25,
    borderRadius: 12.5,
  },
  circleTop3: {
    top: -12,
    left: 45,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  circleTop4: {
    top: -16,
    left: 65,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  circleTop5: {
    top: -16,
    left: 85,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  circleTop6: {
    top: -18,
    left: 105,
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  circleTop7: {
    top: -12,
    left: 135,
    width: 25,
    height: 25,
    borderRadius: 12.5,
  },
  circleTop8: {
    top: -20,
    left: 155,
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  circleTop9: {
    top: -16,
    left: 185,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  circleTop10: {
    top: -13,
    left: 210,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  circleTop11: {
    top: -14,
    left: 235,
    width: 25,
    height: 25,
    borderRadius: 12.5,
  },
  circleTop12: {
    top: -16,
    left: 260,
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  // ============== Bottom edge circles ==============
  circleBottom1: {
    bottom: -15,
    left: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  circleBottom2: {
    bottom: -12,
    left: 25,
    width: 25,
    height: 25,
    borderRadius: 12.5,
  },
  circleBottom3: {
    bottom: -15,
    left: 45,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  circleBottom4: {
    bottom: -16,
    left: 65,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  circleBottom5: {
    bottom: -18,
    left: 85,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  circleBottom6: {
    bottom: -21,
    left: 105,
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  circleBottom7: {
    bottom: -16,
    left: 135,
    width: 25,
    height: 25,
    borderRadius: 12.5,
  },
  circleBottom8: {
    bottom: -18,
    left: 158,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  circleBottom9: {
    bottom: -16,
    left: 185,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  circleBottom10: {
    bottom: -13,
    left: 210,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  circleBottom11: {
    bottom: -14,
    left: 235,
    width: 25,
    height: 25,
    borderRadius: 12.5,
  },
  circleBottom12: {
    bottom: -16,
    left: 260,
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  // ============== Left edge circles ==============
  circleLeft1: {
    left: -8,
    top: 25,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  circleLeft2: {
    left: -10,
    top: 60,
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  circleLeft3: {
    left: -12,
    top: 100,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  circleLeft4: {
    left: -16,
    top: 140,
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  // ============== Right edge circles ==============
  circleRight1: {
    right: -14,
    top: 20,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  circleRight2: {
    right: -10,
    top: 60,
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  circleRight3: {
    right: -12,
    top: 100,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  circleRight4: {
    right: -16,
    top: 140,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});

export default CloudBubble;
