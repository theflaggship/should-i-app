// src/screens/OtherUserProfileScreen.js
import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

// Services
import { getUserById } from '../services/userService';
import { followUser, unfollowUser } from '../services/followService';

// Zustand store
import { usePollsStore } from '../store/usePollsStore';
import { useUserStatsStore } from '../store/useUserStatsStore';

// UI & Components
import PollCard from '../components/PollCard';
import VoteCard from '../components/VoteCard';
import CommentCard from '../components/CommentCard';
import { Check, ArrowLeftCircle } from 'react-native-feather';
import colors from '../styles/colors';

const TABS = {
  POLLS: 'POLLS',
  VOTES: 'VOTES',
  COMMENTS: 'COMMENTS',
};

export default function OtherUserProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useContext(AuthContext);

  // The ID of the user we want to view
  const viewedUserId = route.params?.userId;

  // ----- Zustand store for pagination-based actions -----
  const {
    // For Polls
    userPolls,
    userPollsOffset,
    userPollsPageSize,
    userPollsTotalCount,
    fetchUserPollsPage,
    loadMoreUserPollsPage,

    // For Votes
    votedPolls,
    userVotesOffset,
    userVotesPageSize,
    userVotesTotalCount,
    fetchUserVotesPage,
    loadMoreUserVotesPage,

    // For Comments
    userComments,
    userCommentsOffset,
    userCommentsPageSize,
    userCommentsTotalCount,
    fetchUserCommentsPage,
    loadMoreUserCommentsPage,

    // Shared store states
    loading,
    error,
  } = usePollsStore();

  // ----- Stats store for the viewed user -----
  const {
    followers,
    following,
    totalPolls,
    totalVotes,
    fetchStats,
    loading: statsLoading,
    error: statsError,
  } = useUserStatsStore();

  // Local state for user’s profile object
  const [profileOwner, setProfileOwner] = useState(null);

  // Tab selection
  const [selectedTab, setSelectedTab] = useState(TABS.POLLS);

  // Keep track of whether we’re following them
  const [isFollowing, setIsFollowing] = useState(false);

  // For pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // On mount or if viewedUserId changes, fetch user data & stats
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!viewedUserId) return;
    fetchUserProfileAndStats();
  }, [viewedUserId]);

  // Initial fetch for the default tab (POLLS) – you can do it in the same effect
  useEffect(() => {
    if (!viewedUserId || !token) return;
    // Fetch the first page of "Polls" for this user
    fetchUserPollsPage(token, viewedUserId, userPollsPageSize, 0);
  }, [viewedUserId, token]);

  // Helper to fetch user info & stats
  const fetchUserProfileAndStats = async () => {
    try {
      const fetchedUser = await getUserById(viewedUserId, token);
      setProfileOwner(fetchedUser);

      // If your backend includes "amIFollowing" boolean:
      if (typeof fetchedUser.amIFollowing === 'boolean') {
        setIsFollowing(fetchedUser.amIFollowing);
      } else {
        setIsFollowing(false);
      }

      // Fetch stats for that user
      fetchStats(viewedUserId, token);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // useFocusEffect: refresh the current tab whenever screen regains focus
  // ─────────────────────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!viewedUserId || !token) return;

      switch (selectedTab) {
        case TABS.POLLS:
          fetchUserPollsPage(token, viewedUserId, userPollsPageSize, 0);
          break;
        case TABS.VOTES:
          fetchUserVotesPage(token, viewedUserId, userVotesPageSize, 0);
          break;
        case TABS.COMMENTS:
          fetchUserCommentsPage(token, viewedUserId, userCommentsPageSize, 0);
          break;
        default:
          break;
      }
    }, [selectedTab, viewedUserId, token])
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab switching logic
  // ─────────────────────────────────────────────────────────────────────────────
  const handleTabPress = async (tab) => {
    setSelectedTab(tab);
    setRefreshing(true);
    try {
      if (tab === TABS.POLLS) {
        await fetchUserPollsPage(token, viewedUserId, userPollsPageSize, 0);
      } else if (tab === TABS.VOTES) {
        await fetchUserVotesPage(token, viewedUserId, userVotesPageSize, 0);
      } else if (tab === TABS.COMMENTS) {
        await fetchUserCommentsPage(token, viewedUserId, userCommentsPageSize, 0);
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
      if (selectedTab === TABS.POLLS) {
        await fetchUserPollsPage(token, viewedUserId, userPollsPageSize, 0);
      } else if (selectedTab === TABS.VOTES) {
        await fetchUserVotesPage(token, viewedUserId, userVotesPageSize, 0);
      } else if (selectedTab === TABS.COMMENTS) {
        await fetchUserCommentsPage(token, viewedUserId, userCommentsPageSize, 0);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Infinite Scroll "Load More" logic
  // ─────────────────────────────────────────────────────────────────────────────
  const handleLoadMore = async () => {
    if (loading) return;

    if (selectedTab === TABS.POLLS) {
      const canLoadMore = userPolls.length < userPollsTotalCount;
      if (canLoadMore) {
        await loadMoreUserPollsPage(token, viewedUserId);
      }
    } else if (selectedTab === TABS.VOTES) {
      const canLoadMore = votedPolls.length < userVotesTotalCount;
      if (canLoadMore) {
        await loadMoreUserVotesPage(token, viewedUserId);
      }
    } else if (selectedTab === TABS.COMMENTS) {
      const canLoadMore = userComments.length < userCommentsTotalCount;
      if (canLoadMore) {
        await loadMoreUserCommentsPage(token, viewedUserId);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Follow/Unfollow logic
  // ─────────────────────────────────────────────────────────────────────────────
  const handleFollowToggle = async () => {
    if (!viewedUserId || !token) return;

    try {
      if (isFollowing) {
        // Unfollow
        await unfollowUser(viewedUserId, token);
        setIsFollowing(false);
      } else {
        // Follow
        await followUser(viewedUserId, token);
        setIsFollowing(true);
      }
      // Re-fetch stats to update follower count
      fetchStats(viewedUserId, token);
    } catch (err) {
      console.error('Follow/Unfollow error:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render the tab content
  // ─────────────────────────────────────────────────────────────────────────────
  const renderTabContent = () => {
    // If loading and no data yet:
    if (loading) {
      const noData =
        (selectedTab === TABS.POLLS && userPolls.length === 0) ||
        (selectedTab === TABS.VOTES && votedPolls.length === 0) ||
        (selectedTab === TABS.COMMENTS && userComments.length === 0);

      if (noData) {
        return (
          <ActivityIndicator
            style={{ marginTop: 20 }}
            color={colors.primary}
            size="large"
          />
        );
      }
    }

    if (error) {
      return <Text style={{ color: 'red', marginTop: 20 }}>{error}</Text>;
    }

    switch (selectedTab) {
      case TABS.POLLS: {
        if (userPolls.length === 0) {
          return (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>This user hasn't posted any polls yet.</Text>
            </View>
          );
        }
        return (
          <FlatList
            data={userPolls}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <PollCard poll={item} disableMainPress={false} />}
            contentContainerStyle={{ paddingBottom: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            onEndReachedThreshold={0.7}
            onEndReached={handleLoadMore}
            ListFooterComponent={
              loading && userPolls.length > 0 ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />
              ) : null
            }
          />
        );
      }

      case TABS.VOTES: {
        if (votedPolls.length === 0) {
          return (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>This user hasn't voted on any polls yet.</Text>
            </View>
          );
        }
        return (
          <FlatList
            data={votedPolls}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <VoteCard poll={item} />}
            contentContainerStyle={{ paddingBottom: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            onEndReachedThreshold={0.7}
            onEndReached={handleLoadMore}
            ListFooterComponent={
              loading && votedPolls.length > 0 ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />
              ) : null
            }
          />
        );
      }

      case TABS.COMMENTS: {
        if (userComments.length === 0) {
          return (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>This user hasn't made any comments yet.</Text>
            </View>
          );
        }
        return (
          <FlatList
            data={userComments}
            keyExtractor={(item) => item.pollId.toString()}
            renderItem={({ item }) => (
              <CommentCard poll={item.poll} userComments={item.userComments} />
            )}
            contentContainerStyle={{ paddingBottom: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            onEndReachedThreshold={0.7}
            onEndReached={handleLoadMore}
            ListFooterComponent={
              loading && userComments.length > 0 ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />
              ) : null
            }
          />
        );
      }

      default:
        return null;
    }
  };

  // If we haven't loaded the user yet
  if (!profileOwner) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const showSummary =
    profileOwner.personalSummary && profileOwner.personalSummary.trim() !== '';

  return (
    <View style={styles.container}>
      {/* Custom back button on top of user pic */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <ArrowLeftCircle width={30} color={colors.light} />
      </TouchableOpacity>

      {/* The top header with user pic + follow button */}
      <View style={styles.profileHeader}>
        <View style={styles.userRow}>
          <Image
            source={{ uri: profileOwner.profilePicture || 'https://picsum.photos/200/200' }}
            style={styles.profileImage}
          />
          <View style={styles.userTextBlock}>
            <Text style={styles.displayName}>{profileOwner.displayName || `@${profileOwner.username}`}</Text>
            {profileOwner.displayName && <Text style={styles.usernameSubtitle}>@{profileOwner.username}</Text>}
          </View>
          <TouchableOpacity style={[styles.followButton, isFollowing ? { backgroundColor: colors.input } : { backgroundColor: colors.secondary }]} onPress={handleFollowToggle}>
            <Text style={[styles.followButtonText, isFollowing ? { color: colors.light } : {}]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
            {isFollowing && <Check width={16} height={16} color={colors.secondary} style={{ marginLeft: 6 }} />}
          </TouchableOpacity>
        </View>

        {showSummary && (
          <Text style={styles.summaryText}>{profileOwner.personalSummary}</Text>
        )}

        {/* Stats from useUserStatsStore */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              navigation.navigate('FollowersFollowingScreen', {
                userId: profileOwner.id,
                mode: 'followers',
              })
            }
          >
            <Text style={styles.statNumber}>{followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>

          {/* Following */}
          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              navigation.navigate('FollowersFollowingScreen', {
                userId: profileOwner.id,
                mode: 'following',
              })
            }
          >
            <Text style={styles.statNumber}>{following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalPolls}</Text>
            <Text style={styles.statLabel}>Polls</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalVotes}</Text>
            <Text style={styles.statLabel}>Total Votes</Text>
          </View>
        </View>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === TABS.POLLS && styles.activeTabButton]}
          onPress={() => handleTabPress(TABS.POLLS)}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === TABS.POLLS && styles.activeTabButtonText,
            ]}
          >
            Polls
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === TABS.VOTES && styles.activeTabButton]}
          onPress={() => handleTabPress(TABS.VOTES)}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === TABS.VOTES && styles.activeTabButtonText,
            ]}
          >
            Votes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === TABS.COMMENTS && styles.activeTabButton]}
          onPress={() => handleTabPress(TABS.COMMENTS)}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === TABS.COMMENTS && styles.activeTabButtonText,
            ]}
          >
            Comments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      <View style={styles.tabContent}>{renderTabContent()}</View>
    </View>
  );
}

// ============= STYLES =============
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: colors.appBackground || '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 50, // adjust as needed so it sits above user pic
    left: 16,
    zIndex: 9999,
  },
  profileHeader: {
    backgroundColor: colors.dark,
    paddingTop: 80,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  userRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  userTextBlock: {
    flex: 1, 
    paddingLeft: 14
  },
  displayName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.light
  },
  usernameSubtitle: {
    fontSize: 14,
    color: colors.secondaryLight
  },
  followButton: {
    display: 'flex',
    flexDirection: 'row',
    position: 'absolute',
    top: -35,            // lifts button above profile image
    right: -5,  
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  followButtonText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '600',
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.light,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: colors.light,
    marginBottom: 12,
    marginTop: 2,
    paddingLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondaryLight,
  },
  statLabel: {
    fontSize: 12,
    color: colors.secondaryLight,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // "No data" fallback styling
  noDataContainer: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 16,
    color: colors.dark,
    textAlign: 'center',
  },
});
