// src/screens/HomeScreen.js
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getPolls } from '../services/pollService';
import PollCard from '../components/PollCard';
import colors from '../styles/colors';

const HomeScreen = () => {
  const { token } = useContext(AuthContext);  // Access token if your backend requires auth
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch polls from your backend
  const fetchPolls = async () => {
    try {
      setLoading(true);
      setError(null);

      // If your backend requires an auth token, pass it here
      const data = await getPolls(token); 
      setPolls(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Called when user votes or changes vote in PollCard
  const handleVote = (pollId, optionId) => {
    console.log(`User voted optionId=${optionId} on pollId=${pollId}`);
    // Optionally call an API to record the vote
    // e.g. await voteOnPoll(pollId, optionId, token);
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  // Show loading spinner while fetching
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show error message if there's a problem
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  // Render list of polls using PollCard
  return (
    <View style={styles.container}>
      <FlatList
        data={polls}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PollCard
            poll={item}
            onVote={handleVote}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

export default HomeScreen;
