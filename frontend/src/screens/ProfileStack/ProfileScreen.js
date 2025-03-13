// src/screens/ProfileScreen.js

import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { usePollsStore } from '../../store/usePollsStore';
import { useUserStatsStore } from '../../store/useUserStatsStore'; // <-- NEW
import PollCard from '../../components/PollCard';
import VoteCard from '../../components/VoteCard';
import CommentCard from '../../components/CommentCard';
import PollModalsManager from '../../components/PollModalsManager';
import EditProfileModal from '../../components/EditProfileModal';

import { getUserById, getUserComments } from '../../services/userService';
import { deletePoll, updatePoll, sendVoteWS } from '../../services/pollService';
import colors from '../../styles/colors';

const { height } = Dimensions.get('window');

// Re-ordered TABS: POLLS -> VOTES -> COMMENTS
const TABS = {
  POLLS: 'POLLS',
  VOTES: 'VOTES',
  COMMENTS: 'COMMENTS',
};

export default function ProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user: loggedInUser, token } = useContext(AuthContext);

  // If route.params.userId is provided, we are viewing someone else’s profile
  // Otherwise, default to the logged-in user's ID
  const viewedUserId = route.params?.userId || loggedInUser.id;
  const isMyProfile = viewedUserId === loggedInUser.id;

  // Zustand store for polls
  const userPolls = usePollsStore((state) => state.userPolls);
  const votedPolls = usePollsStore((state) => state.votedPolls);
  const fetchUserPolls = usePollsStore((state) => state.fetchUserPolls);
  const fetchUserVotedPolls = usePollsStore((state) => state.fetchUserVotedPolls);
  const removePoll = usePollsStore((state) => state.removePoll);
  const updatePollInBoth = usePollsStore((state) => state.updatePollInBoth);
  const loading = usePollsStore((state) => state.loading);
  const error = usePollsStore((state) => state.error);

  // Zustand store for user stats
  const {
    followers,
    following,
    totalPolls,
    totalVotes,
    fetchStats,
    loading: statsLoading,
    error: statsError,
  } = useUserStatsStore();

  // We store whichever user is being viewed in `profileOwner`.
  // If it's my profile, we can just set it to `loggedInUser`.
  // If it's another user, we fetch from an API (e.g., getUserById).
  const [profileOwner, setProfileOwner] = useState(isMyProfile ? loggedInUser : null);

  // Local state for the "Comments" tab
  const [commentsGroupedByPoll, setCommentsGroupedByPoll] = useState([]);
  // Tab selection
  const [selectedTab, setSelectedTab] = useState(TABS.POLLS);

  // If you need "Follow" logic for other users, you could track isFollowing, etc.
  const [isFollowing, setIsFollowing] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // On mount or if viewedUserId changes: fetch user & stats
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDataForProfile();
    fetchStats(viewedUserId, token); // get stats from userStatsStore
  }, [viewedUserId]);

  const fetchDataForProfile = async () => {
    try {
      if (!isMyProfile) {
        // If not my profile, fetch user from API
        const fetchedUser = await getUserById(viewedUserId, token);
        setProfileOwner(fetchedUser);
      } else {
        // If it's my profile, just set it to loggedInUser
        setProfileOwner(loggedInUser);
      }

      // Now fetch user’s polls
      await fetchUserPolls(token, viewedUserId);
    } catch (err) {
      console.error('Error fetching profile data:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Voting logic
  // ─────────────────────────────────────────────────────────────────────────────
  const handleVote = (pollId, optionId) => {
    if (!loggedInUser?.id) return;
    // We use websockets to cast a vote
    sendVoteWS(loggedInUser.id, pollId, optionId);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab switching
  // ─────────────────────────────────────────────────────────────────────────────
  const handleTabPress = async (tab) => {
    setSelectedTab(tab);

    if (tab === TABS.POLLS) {
      await fetchUserPolls(token, viewedUserId);
    } else if (tab === TABS.VOTES) {
      await fetchUserVotedPolls(token, viewedUserId);
    } else if (tab === TABS.COMMENTS) {
      try {
        const data = await getUserComments(viewedUserId, token);
        // Group them by poll
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
        console.error('Fetching user comments error:', err);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Poll Modals & Edit Profile
  // ─────────────────────────────────────────────────────────────────────────────
  const pollModalsRef = useRef(null);
  const editProfileRef = useRef(null);

  const handleOpenMenu = (poll) => {
    // Only open modals if it's my profile
    if (!isMyProfile) return;
    pollModalsRef.current?.openMenu(poll);
  };

  const handleDeletePoll = async (pollToDelete) => {
    try {
      await deletePoll(token, pollToDelete.id);
      removePoll(pollToDelete.id);
    } catch (err) {
      console.error('Failed to delete poll:', err);
    }
  };

  const handleSavePoll = async (pollToEdit, payload) => {
    try {
      const result = await updatePoll(token, pollToEdit.id, payload);
      if (result.poll && Array.isArray(result.poll.options)) {
        updatePollInBoth(pollToEdit.id, {
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

  const handleSaveProfile = (updatedUser) => {
    // If you have a real API call, do it here
    setProfileOwner(updatedUser);
    // Optionally update context or do something else
  };

  // If we haven't loaded the user yet
  if (!profileOwner) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render tab content
  // ─────────────────────────────────────────────────────────────────────────────
  const renderTabContent = () => {
    if (loading) {
      return <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} size="large" />;
    }
    if (error) {
      return <Text style={{ color: 'red', marginTop: 20 }}>{error}</Text>;
    }

    if (selectedTab === TABS.POLLS) {
      return (
        <FlatList
          data={userPolls}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PollCard
              poll={item}
              onVote={handleVote}
              onOpenMenu={isMyProfile ? handleOpenMenu : undefined}
            />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    } else if (selectedTab === TABS.VOTES) {
      return (
        <FlatList
          data={votedPolls}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <VoteCard poll={item} user={loggedInUser} />}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    } else if (selectedTab === TABS.COMMENTS) {
      return (
        <FlatList
          data={commentsGroupedByPoll}
          keyExtractor={(item) => item.pollId.toString()}
          renderItem={({ item }) => (
            <CommentCard poll={item.poll} userComments={item.userComments} user={loggedInUser} />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    }
    return null;
  };

  // Basic follow logic if not my profile (optional)
  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    // You could call follow/unfollow logic here if you wanted
  };

  // If you'd like to show the "Follow" button on your own profile if routeParams is not you
  // or if isMyProfile is false, etc.

  const showSummary = profileOwner.personalSummary && profileOwner.personalSummary.trim() !== '';

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.picContainer}>
          <Image
            source={{
              uri: profileOwner.profilePicture || 'https://picsum.photos/200/200',
            }}
            style={styles.profileImage}
          />
          {isMyProfile ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => editProfileRef.current?.openEditProfile(profileOwner)}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.editButton,
                { backgroundColor: isFollowing ? '#666' : '#21D0B2' },
              ]}
              onPress={handleFollowToggle}
            >
              <Text style={styles.editButtonText}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.username}>@{profileOwner.username || 'Unknown'}</Text>
        {isMyProfile ? (
          <Text style={styles.summaryText}>
            {profileOwner.personalSummary || 'No personal summary yet.'}
          </Text>
        ) : null}

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

      <View style={styles.tabContent}>{renderTabContent()}</View>

      {/* PollModalsManager (only if my profile) */}
      {isMyProfile && (
        <PollModalsManager
          ref={pollModalsRef}
          onDeletePoll={handleDeletePoll}
          onSavePoll={handleSavePoll}
        />
      )}

      {/* EditProfileModal (only if my profile) */}
      {isMyProfile && (
        <EditProfileModal
          ref={editProfileRef}
          onSaveProfile={handleSaveProfile}
        />
      )}
    </View>
  );
}

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
  profileHeader: {
    backgroundColor: colors.dark,
    paddingTop: 60,
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
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#21D0B2',
    backgroundColor: '#21D0B2',
  },
  editButtonText: {
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
});
