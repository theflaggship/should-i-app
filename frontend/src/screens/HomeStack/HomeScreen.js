// src/screens/HomeStack/HomeScreen.js

import React, { useRef, useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
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
import { usePollsStore } from '../../store/usePollsStore'; // <--- 1) import here
import PollCard from '../../components/PollCard';
import PollModalsManager from '../../components/PollModalsManager';
import colors from '../../styles/colors';
import { deletePoll, updatePoll, sendVoteWS } from '../../services/pollService';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const { height } = Dimensions.get('window');

// Two main tabs: DISCOVER, FOLLOWING
const TABS = {
  DISCOVER: 'DISCOVER',
  FOLLOWING: 'FOLLOWING',
};

const HomeScreen = () => {
  // Pull user + token from AuthContext
  const { user, token } = useContext(AuthContext);

  // The poll store references
  const {
    polls,
    followingPolls,
    loading,
    error,
    discoverPageSize,
    discoverTotalCount,
    fetchAllPollsPage,
    loadMorePollsPage,
    followingPageSize,
    followingTotalCount,
    fetchFollowingPollsPage,
    loadMoreFollowingPolls,
    removePoll,
  } = usePollsStore();

  // We store which tab is selected
  const [selectedTab, setSelectedTab] = useState(TABS.DISCOVER);
  const [refreshing, setRefreshing] = useState(false);

  // Optional: for an animated top bar
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const navbarTranslate = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  // Reference to PollModalsManager (for delete/edit actions)
  const pollModalsRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2) On mount (or user changes), call initPolls once to connect WS
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user?.id && token) {
      // This calls connectVoteSocket(...) & connectCommentSocket(...) in the store
      usePollsStore.getState().initPolls(token, user.id);
    }
  }, [user?.id, token]);

  // ─────────────────────────────────────────────────────────────────────────────
  // On mount: load the first page for "Discover"
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      fetchAllPollsPage(token, discoverPageSize, 0).catch((err) => {
        console.error('Initial discover fetch error:', err);
      });
    }
  }, [token, discoverPageSize, fetchAllPollsPage]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Switch tabs
  // ─────────────────────────────────────────────────────────────────────────────
  const handleTabPress = async (tab) => {
    setSelectedTab(tab);
    setRefreshing(true);
    try {
      if (tab === TABS.DISCOVER) {
        await fetchAllPollsPage(token, discoverPageSize, 0);
      } else {
        await fetchFollowingPollsPage(token, followingPageSize, 0);
      }
    } catch (err) {
      console.error('Tab fetch error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Pull-to-refresh
  // ─────────────────────────────────────────────────────────────────────────────
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedTab === TABS.DISCOVER) {
        await fetchAllPollsPage(token, discoverPageSize, 0);
      } else {
        await fetchFollowingPollsPage(token, followingPageSize, 0);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Decide which data array & pagination to use
  // ─────────────────────────────────────────────────────────────────────────────
  const dataToRender =
    selectedTab === TABS.DISCOVER ? polls : followingPolls;

  const totalCount =
    selectedTab === TABS.DISCOVER ? discoverTotalCount : followingTotalCount;
  const canLoadMore = dataToRender.length < totalCount;

  // ─────────────────────────────────────────────────────────────────────────────
  // Infinite scroll
  // ─────────────────────────────────────────────────────────────────────────────
  const handleEndReached = async () => {
    if (loading || !canLoadMore) return;
    if (selectedTab === TABS.DISCOVER) {
      await loadMorePollsPage(token);
    } else {
      await loadMoreFollowingPolls(token);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Voting
  // ─────────────────────────────────────────────────────────────────────────────
  const handleVote = (pollId, optionId) => {
    if (!user?.id) return; // Make sure we have a numeric user.id
    // This calls the WS client
    sendVoteWS(user.id, pollId, optionId);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PollModalsManager callbacks
  // ─────────────────────────────────────────────────────────────────────────────
  const handleOpenMenu = (poll) => {
    pollModalsRef.current?.openMenu(poll);
  };

  const handleDeletePoll = async (poll) => {
    try {
      await deletePoll(token, poll.id);
      removePoll(poll.id);
    } catch (err) {
      console.error('Failed to delete poll:', err);
    }
  };

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

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (loading && dataToRender.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <Image
          style={styles.logo}
          source={require('../../../graphics/whicha_logo.png')}
        />
      </View>

      {/* Tabs row */}
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
            <PollCard
              poll={item}
              onOpenMenu={handleOpenMenu}
              onVote={handleVote}
            />
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
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.7}
        ListFooterComponent={
          loading && dataToRender.length > 0 ? (
            <ActivityIndicator color={colors.primary} style={{ margin: 12 }} />
          ) : null
        }
      />

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
  logo: {
    width: 150,
    height: 55,
    resizeMode: 'contain',
    marginTop: 30,
  },
  tabsRow: {
    flexDirection: 'row',
    marginTop: 100,
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
