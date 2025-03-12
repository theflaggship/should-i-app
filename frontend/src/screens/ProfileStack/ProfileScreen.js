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
import { AuthContext } from '../../context/AuthContext';
import { usePollsStore } from '../../store/usePollsStore';
import PollCard from '../../components/PollCard';
import VoteCard from '../../components/VoteCard';
import CommentCard from '../../components/CommentCard';
import PollModalsManager from '../../components/PollModalsManager'; // <-- NEW
import { getUserComments, getUserStats } from '../../services/userService';
import { deletePoll, updatePoll, sendVoteWS } from '../../services/pollService';
import colors from '../../styles/colors';

const { height } = Dimensions.get('window');

// Re-ordered TABS: POLLS -> VOTES -> COMMENTS
const TABS = {
  POLLS: 'POLLS',
  VOTES: 'VOTES',
  COMMENTS: 'COMMENTS',
};

const ProfileScreen = ({ navigation }) => {
  const { user, token } = useContext(AuthContext);

  // Zustand store
  const userPolls = usePollsStore((state) => state.userPolls);
  const votedPolls = usePollsStore((state) => state.votedPolls);
  const fetchUserPolls = usePollsStore((state) => state.fetchUserPolls);
  const fetchUserVotedPolls = usePollsStore((state) => state.fetchUserVotedPolls);

  // Methods to remove/update poll in store
  const removePoll = usePollsStore((state) => state.removePoll);
  const updatePollInBoth = usePollsStore((state) => state.updatePollInBoth);

  const loading = usePollsStore((state) => state.loading);
  const error = usePollsStore((state) => state.error);

  // Local states for comments
  const [comments, setComments] = useState([]);
  const [commentsGroupedByPoll, setCommentsGroupedByPoll] = useState([]);
  const [selectedTab, setSelectedTab] = useState(TABS.POLLS);

  // Stats
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    totalPolls: 0,
    totalVotes: 0,
  });

  // On mount: fetch user’s polls & stats
  useEffect(() => {
    fetchUserPolls(token, user.id);
    fetchStats();
  }, [token, user.id]);

  const fetchStats = async () => {
    try {
      const data = await getUserStats(user.id, token);
      setStats(data);
    } catch (err) {
      console.error('Fetching user stats error:', err);
    }
  };

  // Voting
  const handleVote = (pollId, optionId) => {
    if (!user?.id) return;
    sendVoteWS(user.id, pollId, optionId);
  };

  // Tab Switching
  const handleTabPress = async (tab) => {
    setSelectedTab(tab);

    if (tab === TABS.POLLS) {
      await fetchUserPolls(token, user.id);
    } else if (tab === TABS.VOTES) {
      await fetchUserVotedPolls(token, user.id);
    } else if (tab === TABS.COMMENTS) {
      try {
        const data = await getUserComments(user.id, token);
        setComments(data);

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

  // ===== PollModalsManager usage =====
  const pollModalsRef = useRef(null);

  // Called when user taps the ellipsis on a PollCard
  const handleOpenMenu = (poll) => {
    pollModalsRef.current?.openMenu(poll);
  };

  // Called by PollModalsManager when user confirms delete
  const handleDeletePoll = async (pollToDelete) => {
    try {
      await deletePoll(token, pollToDelete.id);
      removePoll(pollToDelete.id); // Removes from the store
    } catch (err) {
      console.error('Failed to delete poll:', err);
    }
  };

  // Called by PollModalsManager when user saves toggles or full edit
  const handleSavePoll = async (pollToEdit, payload) => {
    try {
      const result = await updatePoll(token, pollToEdit.id, payload);
      if (result.poll && Array.isArray(result.poll.options)) {
        // Merge changes into both `polls` and `userPolls`
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

  // Render tab content
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
            <PollCard poll={item} onVote={handleVote} onOpenMenu={handleOpenMenu} />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    } else if (selectedTab === TABS.VOTES) {
      return (
        <FlatList
          data={votedPolls}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <VoteCard poll={item} />}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    } else if (selectedTab === TABS.COMMENTS) {
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

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.picContainer}>
          <Image
            source={{ uri: user.profilePicture || 'https://picsum.photos/200/200' }}
            style={styles.profileImage}
          />
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.summaryText}>
          {user.personalSummary || 'No personal summary yet.'}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalPolls}</Text>
            <Text style={styles.statLabel}>Polls</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalVotes}</Text>
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

      {/* Tab Content */}
      <View style={styles.tabContent}>{renderTabContent()}</View>

      {/* PollModalsManager for editing/deleting polls */}
      <PollModalsManager
        ref={pollModalsRef}
        onDeletePoll={handleDeletePoll}
        onSavePoll={handleSavePoll}
      />
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
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
    backgroundColor: '#21D0B2',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#21D0B2',
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
