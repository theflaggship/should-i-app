// src/screens/HomeStack/HomeScreen.js

import React, { useRef, useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
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

const TABS = {
  DISCOVER: 'DISCOVER',
  FOLLOWING: 'FOLLOWING',
};

const HomeScreen = () => {
  const { user, token } = useContext(AuthContext);

  // ----- Zustand store stuff -----
  const polls = usePollsStore((state) => state.polls);                 // For "DISCOVER"
  const followingPolls = usePollsStore((state) => state.followingPolls); // For "FOLLOWING"

  const fetchAllPolls = usePollsStore((state) => state.fetchAllPolls);
  const fetchFollowingPolls = usePollsStore((state) => state.fetchFollowingPolls);

  const removePoll = usePollsStore((state) => state.removePoll);
  const loading = usePollsStore((state) => state.loading);
  const error = usePollsStore((state) => state.error);

  // Which tab is selected?
  const [selectedTab, setSelectedTab] = useState(TABS.DISCOVER);

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

  // On mount, fetch the initial tab data
  useEffect(() => {
    if (token) {
      // Only fetch if token is defined
      fetchAllPolls(token).catch((err) => {
        console.error('Initial fetch error:', err);
      });
    }
  }, [token, fetchAllPolls]);

  // Handler for switching tabs
  const handleTabPress = async (tab) => {
    setSelectedTab(tab);
    setRefreshing(true);
    try {
      if (tab === TABS.DISCOVER) {
        await fetchAllPolls(token);
      } else {
        // tab === TABS.FOLLOWING
        await fetchFollowingPolls(token);
      }
    } catch (err) {
      console.error('Tab fetch error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedTab === TABS.DISCOVER) {
        await fetchAllPolls(token);
      } else {
        await fetchFollowingPolls(token);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Called by PollCard’s onOpenMenu
  const handleOpenMenu = (poll) => {
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

  // Called by the manager to save poll edits
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

  // Decide which array to render
  const dataToRender = selectedTab === TABS.DISCOVER ? polls : followingPolls;

  return (
    <View style={styles.container}>
      {/* <Animated.View
        style={[{ transform: [{ translateY: navbarTranslate }] }]}
      >
        </Animated.View> */}
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>Whicha</Text>
      </View>
      {/* Animated Navbar */}

      {/* Top row for the two tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === TABS.DISCOVER && styles.activeTabButton,
          ]}
          onPress={() => handleTabPress(TABS.DISCOVER)}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === TABS.DISCOVER && styles.activeTabButtonText,
            ]}
          >
            Discover
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === TABS.FOLLOWING && styles.activeTabButton,
          ]}
          onPress={() => handleTabPress(TABS.FOLLOWING)}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === TABS.FOLLOWING && styles.activeTabButtonText,
            ]}
          >
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {/* Show spinner if loading and no polls yet */}
      {loading && dataToRender.length === 0 && (
        <ActivityIndicator
          style={{ marginVertical: 20 }}
          color={colors.primary}
        />
      )}

      <AnimatedFlatList
        data={dataToRender}
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
  tabsRow: {
    flexDirection: 'row',
    marginTop: 100, // so it's below the nav bar
    backgroundColor: '#f0f0f0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.dark,
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  pollCardContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  firstPollCardContainer: {
    // Because we have 2 bars now, we add extra margin
    marginTop: 16,
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
