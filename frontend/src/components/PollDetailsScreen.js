// src/screens/PollDetailsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getPollById } from '../services/pollService';
import globalStyles from '../styles/globalStyles';
import colors from '../styles/colors';

const PollDetailsScreen = ({ route }) => {
  const { pollId } = route.params;
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPoll = async () => {
    try {
      const data = await getPollById(pollId);
      setPoll(data);
    } catch (error) {
      console.error('Error fetching poll:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  if (loading) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.text}>Loading poll details...</Text>
      </View>
    );
  }

  if (!poll) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.text}>Poll not found.</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Poll Details</Text>
      <Text style={globalStyles.text}>{poll.question}</Text>
      {/* Extend this screen to show poll options, voting percentages, expiration, etc. */}
    </View>
  );
};

export default PollDetailsScreen;
