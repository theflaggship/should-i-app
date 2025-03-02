// HomeScreen.js
import React, { useRef, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { usePollsStore } from '../store/usePollsStore';
import { sendVoteWS } from '../services/pollService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PollCard from '../components/PollCard';
import colors from '../styles/colors';

// Wrap FlatList in Animated for smooth scrolling
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const HomeScreen = () => {
  // 1) Destructure 'user' from AuthContext (and token if needed)
  const { user } = useContext(AuthContext);

  // 2) Destructure polls, loading, error, and fetchAllPolls from PollStore
  const polls = usePollsStore((state) => state.polls);
  const loading = usePollsStore((state) => state.loading);
  const error = usePollsStore((state) => state.error);
  
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animate the navbar
  const navbarTranslate = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -35],
    extrapolate: 'clamp',
  });

  // 5) Loading spinner
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 6) Error message
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  // 7) Render list of polls
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
          <View
            style={
              index === 0
                ? styles.firstPollCardContainer
                : styles.pollCardContainer
            }
          >
            <PollCard
              poll={item}
              allowComments={item.allowComments}
              commentCount={item.commentCount}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 16 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      />
    </View>
  );
}

export default HomeScreen;

// ----------------------------------------
// --------------- STYLES ----------------
// ----------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground || '#fff',
  },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: colors.dark || '#333',
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
    marginTop: 30,
  },
  pollCardContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  firstPollCardContainer: {
    marginTop: 118,
    marginHorizontal: 16,
    marginBottom: 16,
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
