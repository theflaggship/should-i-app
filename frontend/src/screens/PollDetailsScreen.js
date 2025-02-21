// src/screens/PollDetailsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getPollById } from '../services/pollService';
import colors from '../styles/colors';

const PollDetailsScreen = ({ route }) => {
  const { pollId } = route.params;
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPoll = async () => {
    try {
      const data = await getPollById(pollId);
      setPoll(data);
    } catch (err) {
      console.error('Error fetching poll:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  if (loading) return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />;
  if (!poll) return <Text style={styles.error}>Poll not found.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{poll.question}</Text>
      {/* Render poll options, percentages, etc. */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { fontSize: 20, color: colors.dark, marginBottom: 16 },
  error: { color: 'red', textAlign: 'center', marginTop: 20 },
});

export default PollDetailsScreen;
