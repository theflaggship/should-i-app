// src/screens/OtherUserProfileScreen.js

import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

// Services
import { getUserById, getUserComments } from '../services/userService';
import { followUser, unfollowUser } from '../services/followService';

// Zustand store
import { usePollsStore } from '../store/usePollsStore';
import { useUserStatsStore } from '../store/useUserStatsStore';

// UI & Components
import PollCard from '../components/PollCard';
import VoteCard from '../components/VoteCard';
import CommentCard from '../components/CommentCard';
import { Check } from 'react-native-feather';
import colors from '../styles/colors';

// Tab constants
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

  // Polls store
  const userPolls = usePollsStore((state) => state.userPolls);
  const votedPolls = usePollsStore((state) => state.votedPolls);
  const fetchUserPolls = usePollsStore((state) => state.fetchUserPolls);
  const fetchUserVotedPolls = usePollsStore((state) => state.fetchUserVotedPolls);

  // Loading/error from polls store
  const loading = usePollsStore((state) => state.loading);
  const error = usePollsStore((state) => state.error);

  // Stats store for the viewed user
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

  // Local state for comments tab
  const [commentsGroupedByPoll, setCommentsGroupedByPoll] = useState([]);

  // Tab selection
  const [selectedTab, setSelectedTab] = useState(TABS.POLLS);

  // Track if we are currently following this user
  const [isFollowing, setIsFollowing] = useState(false);

  // On mount or if viewedUserId changes, fetch user data & stats
  useEffect(() => {
    if (!viewedUserId) return;
    fetchDataForUser();
    fetchStats(viewedUserId, token); // from useUserStatsStore
  }, [viewedUserId]);

  // Fetch user & polls
  const fetchDataForUser = async () => {
    try {
      // 1) Fetch the user data from server
      const fetchedUser = await getUserById(viewedUserId, token);
      setProfileOwner(fetchedUser);

      // 2) If your backend returns amIFollowing
      if (typeof fetchedUser.amIFollowing === 'boolean') {
        setIsFollowing(fetchedUser.amIFollowing);
      } else {
        // If not provided, default to false or do a separate call
        setIsFollowing(false);
      }

      // 3) Fetch user’s polls
      await fetchUserPolls(token, viewedUserId);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  // Tab switching logic
  const handleTabPress = async (tab) => {
    setSelectedTab(tab);

    if (tab === TABS.POLLS) {
      await fetchUserPolls(token, viewedUserId);
    } else if (tab === TABS.VOTES) {
      await fetchUserVotedPolls(token, viewedUserId);
    } else if (tab === TABS.COMMENTS) {
      try {
        const data = await getUserComments(viewedUserId, token);
        const groupedMap = {};
        data.forEach((comment) => {
          const p = comment.poll;
          if (!p) return;
          if (!groupedMap[p.id]) {
            groupedMap[p.id] = {
              pollId: p.id,
              poll: {
                id: p.id,
                question: p.question,
                createdAt: p.createdAt,
                user: p.user,
              },
              userComments: [],
            };
          }
          groupedMap[p.id].userComments.push({
            id: comment.id,
            text: comment.commentText,
            createdAt: comment.createdAt,
          });
        });
        setCommentsGroupedByPoll(Object.values(groupedMap));
      } catch (err) {
        console.error('Error fetching user comments:', err);
      }
    }
  };

  // Follow/Unfollow logic
  const handleFollowToggle = async () => {
    if (!viewedUserId || !token) return;

    if (isFollowing) {
      // Unfollow
      try {
        await unfollowUser(viewedUserId, token);
        setIsFollowing(false);
        // Re-fetch stats to update follower count
        fetchStats(viewedUserId, token);
      } catch (err) {
        console.error('Unfollow error:', err);
      }
    } else {
      // Follow
      try {
        await followUser(viewedUserId, token);
        setIsFollowing(true);
        // Re-fetch stats to update follower count
        fetchStats(viewedUserId, token);
      } catch (err) {
        console.error('Follow error:', err);
      }
    }
  };

  // Render tab content with "no data" messages
  const renderTabContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          style={{ marginTop: 20 }}
          color={colors.primary}
          size="large"
        />
      );
    }
    if (error) {
      return <Text style={{ color: 'red', marginTop: 20 }}>{error}</Text>;
    }

    // 1) Polls tab
    if (selectedTab === TABS.POLLS) {
      if (userPolls.length === 0) {
        return (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              This user hasn't posted any polls yet.
            </Text>
          </View>
        );
      }
      return (
        <FlatList
          data={userPolls}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PollCard poll={item} disableMainPress={false} />}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    }

    // 2) Votes tab
    if (selectedTab === TABS.VOTES) {
      if (votedPolls.length === 0) {
        return (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              This user hasn't voted on any polls yet.
            </Text>
          </View>
        );
      }
      return (
        <FlatList
          data={votedPolls}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <VoteCard poll={item} />}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    }

    // 3) Comments tab
    if (selectedTab === TABS.COMMENTS) {
      if (commentsGroupedByPoll.length === 0) {
        return (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              This user hasn't made any comments yet.
            </Text>
          </View>
        );
      }
      return (
        <FlatList
          data={commentsGroupedByPoll}
          keyExtractor={(item) => item.pollId.toString()}
          renderItem={({ item }) => (
            <CommentCard poll={item.poll} userComments={item.userComments} />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    }

    return null;
  };

  // If we haven't loaded the user yet
  if (!profileOwner) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const showSummary = profileOwner.personalSummary && profileOwner.personalSummary.trim() !== '';

  return (
    <View style={styles.container}>
      {/* Custom back button on top of user pic */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* The top header with user pic + follow button */}
      <View style={styles.profileHeader}>
        <View style={styles.picContainer}>
          <Image
            source={{
              uri: profileOwner.profilePicture || 'https://picsum.photos/200/200',
            }}
            style={styles.profileImage}
          />
          {/* Follow/Unfollow button */}
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing
                ? {
                    backgroundColor: '#2a3d52',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }
                : {
                    backgroundColor: '#21D0B2',
                    right: 20,
                  },
            ]}
            onPress={handleFollowToggle}
          >
            <Text
              style={[
                styles.followButtonText,
                isFollowing ? { color: colors.light } : { color: colors.dark },
              ]}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
            {isFollowing && (
              <Check
                width={16}
                height={16}
                color={colors.secondary}
                style={{ marginLeft: 6 }}
              />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.username}>@{profileOwner.username || 'Unknown'}</Text>

        {showSummary && (
          <Text style={styles.summaryText}>
            {profileOwner.personalSummary}
          </Text>
        )}

        {/* Stats from useUserStatsStore */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
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
    top: 50,   // adjust as needed so it sits above user pic
    left: 16,
    zIndex: 9999,
  },
  backButtonText: {
    color: colors.light,
    fontSize: 16,
    fontWeight: '400',
  },
  profileHeader: {
    backgroundColor: colors.dark,
    paddingTop: 80,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  picContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  followButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#21D0B2',
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
    color: colors.light,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
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
