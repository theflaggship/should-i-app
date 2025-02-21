// src/screens/HomeScreen.js
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Animated
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getPolls, connectWebSocket, sendVote } from '../services/pollService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PollCard from '../components/PollCard';
import colors from '../styles/colors';

// Wrap FlatList in Animated for smooth scrolling
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const HomeScreen = () => {
  const { token } = useContext(AuthContext);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const insets = useSafeAreaInsets();
  const scrollY = React.useRef(new Animated.Value(0)).current;

  // Adjust navbar movement to keep part of it visible
  const navbarTranslate = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -50], // Moves up by 50px instead of disappearing completely
    extrapolate: 'clamp',
  });

  // Fetch polls from API
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPolls(token);
        setPolls(data);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();

    // Connect WebSocket for real-time updates
    connectWebSocket(updatePollState);
  }, []);

  // Update poll state when WebSocket receives new data
  const updatePollState = (pollId, updatedOptions) => {
    setPolls((prevPolls) =>
      prevPolls.map((poll) =>
        poll.id === pollId ? { ...poll, options: updatedOptions } : poll
      )
    );
  };

  // Handle vote submission and send to WebSocket
  const handleVote = (pollId, optionId) => {
    sendVote(pollId, optionId);
  };

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

  return (
    <View style={styles.container}>
      {/* Animated Navbar */}
      <Animated.View style={[styles.navbar, { transform: [{ translateY: navbarTranslate }] }]}>
        <Text style={styles.navTitle}>Should I?</Text>
      </Animated.View>

      <AnimatedFlatList
        data={polls}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <View style={index === 0 ? styles.firstPollCardContainer : styles.pollCardContainer}>
            <PollCard poll={item} onVote={handleVote} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 16 }} // Ensures spacing at the bottom
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80, // Navbar remains partially visible when scrolling
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 4,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  navTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  pollCardContainer: {
    marginHorizontal: 16, // ✅ Adds 1rem (16px) left & right spacing
    marginBottom: 16, // ✅ 1rem (16px) between poll cards
  },
  firstPollCardContainer: {
    marginTop: 96, // ✅ 1rem (16px) below navbar (80px + 16px)
    marginHorizontal: 16, // ✅ Adds 1rem (16px) left & right spacing
    marginBottom: 16, // ✅ Ensures same spacing for following cards
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
