// src/screens/PollDetailsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getPollById } from '../services/pollService';

const PollDetailsScreen = ({ route }) => {
  const { pollId } = route.params;
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPoll = async () => {
    try {
      const data = await getPollById(pollId);
      setPoll(data);
    } catch (error) {
      console.error('Error fetching poll details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading poll details...</Text>
      </View>
    );
  }

  if (!poll) {
    return (
      <View style={styles.container}>
        <Text>Poll not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Poll Details</Text>
      <Text style={styles.question}>{poll.question}</Text>
      {/* Additional poll details and options can be displayed here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, textAlign: 'center', marginBottom: 16 },
  question: { fontSize: 18 }
});

export default PollDetailsScreen;
