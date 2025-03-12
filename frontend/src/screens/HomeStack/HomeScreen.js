import React, { useRef, useContext, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { usePollsStore } from '../../store/usePollsStore';
import PollCard from '../../components/PollCard';
import PollModalsManager from '../../components/PollModalsManager';
import colors from '../../styles/colors';
import { deletePoll, updatePoll } from '../../services/pollService';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const { height } = Dimensions.get('window');

const HomeScreen = () => {
  const { user, token } = useContext(AuthContext);
  const polls = usePollsStore((state) => state.polls);
  const loading = usePollsStore((state) => state.loading);
  const error = usePollsStore((state) => state.error);
  const fetchAllPolls = usePollsStore((state) => state.fetchAllPolls);
  const removePoll = usePollsStore((state) => state.removePoll);

  // For pulling down to refresh
  const [refreshing, setRefreshing] = useState(false);

  // For the “floating” navbar animation
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const navbarTranslate = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  // Reference to our PollModalsManager
  const pollModalsRef = useRef(null);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAllPolls(token);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Called by PollCard’s onOpenMenu
  const handleOpenMenu = (poll) => {
    // Just pass the selected poll to our PollModalsManager
    pollModalsRef.current?.openMenu(poll);
  };

  // Called by the manager to delete a poll
  const handleDeletePoll = async (poll) => {
    try {
      await deletePoll(token, poll.id);
      removePoll(poll.id);
    } catch (err) {
      console.error('Failed to delete poll:', err);
    }
  };

  // Called by the manager to save poll edits (either toggles or full edit)
  const handleSavePoll = async (poll, payload) => {
    try {
      const result = await updatePoll(token, poll.id, payload);
      if (result.poll && Array.isArray(result.poll.options)) {
        usePollsStore.getState().updatePollInStore(poll.id, {
          question: result.poll.question,
          allowComments: result.poll.allowComments,
          isPrivate: result.poll.isPrivate,
          options: result.poll.options.map((o) => ({
            ...o,
            text: o.optionText,
          })),
        });
      }
    } catch (err) {
      console.error('Failed to update poll:', err);
    }
  };

  // If there's a global error from the store
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
      <Animated.View
        style={[styles.navbar, { transform: [{ translateY: navbarTranslate }] }]}
      >
        <Text style={styles.navTitle}>Whicha</Text>
      </Animated.View>

      {/* Show spinner if loading and no polls yet */}
      {loading && polls.length === 0 && (
        <ActivityIndicator
          style={{ marginVertical: 20 }}
          color={colors.primary}
        />
      )}

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
            <PollCard poll={item} onOpenMenu={handleOpenMenu} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={110}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      />

      {/* Reusable PollModalsManager handles all bottom sheets */}
      <PollModalsManager
        ref={pollModalsRef}
        onDeletePoll={handleDeletePoll}
        onSavePoll={handleSavePoll}
      />
    </View>
  );
};

export default HomeScreen;

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
    color: colors.light,
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
